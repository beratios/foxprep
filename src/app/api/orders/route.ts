import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { MAX_PALLETS_PER_ORDER, quote, SERVICE_BY_CODE, type ServiceCode } from "@/lib/pricing";
import { newOrderRef } from "@/lib/ids";
import { PaymentError, orderCheckoutUrl, payOrderWithWallet } from "@/lib/orders";

const Body = z.object({
  channel: z.enum(["FBA", "WFS", "FBM"]),
  units: z.number().int().min(1).max(100000),
  services: z.record(z.number().int().min(0).max(1000000)),
  items: z
    .array(z.object({ productId: z.string().optional(), title: z.string().trim().min(1), sku: z.string().optional(), asin: z.string().optional(), fnsku: z.string().optional(), quantity: z.number().int().min(1) }))
    .max(200),
  supplierName: z.string().trim().max(200).optional(),
  inboundTracking: z.string().trim().max(500).optional(),
  customerNotes: z.string().trim().max(2000).optional(),
  payment: z.enum(["WALLET", "STRIPE"]),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Log in to place an order." }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Check the order details and try again." }, { status: 400 });
  const b = parsed.data;

  const services = Object.fromEntries(Object.entries(b.services).filter(([c]) => c in SERVICE_BY_CODE)) as Partial<Record<ServiceCode, number>>;
  if ((services.pallet_in ?? 0) > MAX_PALLETS_PER_ORDER)
    return NextResponse.json({ error: `We can take up to ${MAX_PALLETS_PER_ORDER} pallets per order. Message us to book space for more.` }, { status: 400 });
  const q = quote({ channel: b.channel, units: b.units, services }); // never trust client prices

  // Only attach products that belong to this user
  const ownIds = new Set(
    (await prisma.product.findMany({ where: { userId: session.uid, id: { in: b.items.map((i) => i.productId!).filter(Boolean) } }, select: { id: true } })).map((p) => p.id),
  );

  let ref = newOrderRef();
  while (await prisma.order.findUnique({ where: { ref } })) ref = newOrderRef();

  const order = await prisma.order.create({
    data: {
      ref,
      userId: session.uid,
      channel: b.channel,
      units: q.units,
      cartons: services.carton_in ?? services.carton_out ?? 0,
      pallets: services.pallet_in ?? services.pallet_out ?? 0,
      fbmOrders: services.fbm_pick ?? 0,
      services,
      lines: q.lines as object[],
      subtotalCents: q.subtotalCents,
      taxCents: q.taxCents,
      totalCents: q.totalCents,
      supplierName: b.supplierName || null,
      inboundTracking: b.inboundTracking || null,
      customerNotes: b.customerNotes || null,
      items: {
        create: b.items.map((i) => ({
          productId: i.productId && ownIds.has(i.productId) ? i.productId : null,
          title: i.title,
          sku: i.sku || null,
          asin: i.asin || null,
          fnsku: i.fnsku || null,
          quantity: i.quantity,
        })),
      },
      events: { create: { status: "AWAITING_PAYMENT", note: "Order created" } },
    },
  });

  try {
    if (b.payment === "WALLET") {
      await payOrderWithWallet(order.id, session.uid);
      return NextResponse.json({ url: `/dashboard/orders/${order.id}?placed=1` });
    }
    return NextResponse.json({ url: await orderCheckoutUrl(order.id, session.uid) });
  } catch (e) {
    const msg = e instanceof PaymentError ? e.message : "Payment could not be started.";
    // The order is kept as "Awaiting payment" so the customer can pay later
    return NextResponse.json({ error: msg, url: `/dashboard/orders/${order.id}` }, { status: 402 });
  }
}
