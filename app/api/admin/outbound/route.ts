import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { quoteOutbound, DEFAULT_RATES } from "@/lib/pricing";

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const shipments = await prisma.outboundShipment.findMany({
    include: { items: { include: { product: true } }, user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ shipments });
}

// Admin/staff creates a shipment ON BEHALF OF a customer — same rules as the
// customer's own /api/outbound: charges that customer's wallet immediately
// (before any prep work happens) and reserves the inventory. Insufficient
// balance blocks creation exactly like the self-serve flow, so staff can't
// accidentally start work that isn't paid for.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, channel, items, polybagQty = 0, bundleQty = 0, insertQty = 0 } = await req.json();
  if (!userId) return NextResponse.json({ error: "A customer must be selected." }, { status: 400 });
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "At least one product line is required." }, { status: 400 });
  }

  const totalUnitsInThisShipment = items.reduce((s: number, it: any) => s + (it.quantity || 0), 0);
  if (totalUnitsInThisShipment < 1) {
    return NextResponse.json({ error: "Quantity must be at least 1." }, { status: 400 });
  }

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const priorShipments = await prisma.outboundShipment.findMany({
    where: { userId, createdAt: { gte: since }, status: { not: "CANCELLED" } },
    include: { items: true },
  });
  const rolling30DayUnits = priorShipments.reduce(
    (sum: number, s: any) => sum + s.items.reduce((si: number, it: any) => si + it.quantity, 0),
    0
  );

  const settings = await prisma.pricingSetting.findUnique({ where: { id: "default" } });
  const rates = settings ?? DEFAULT_RATES;
  const quote = quoteOutbound(totalUnitsInThisShipment, rolling30DayUnits, { polybagQty, bundleQty, insertQty }, rates);

  const walletAgg = await prisma.walletTransaction.aggregate({ where: { userId }, _sum: { amount: true } });
  const balance = walletAgg._sum.amount ?? 0;
  if (balance < quote.total) {
    return NextResponse.json(
      { error: "This customer's wallet balance is insufficient for this shipment.", required: quote.total, balance },
      { status: 402 }
    );
  }

  try {
    const shipment = await prisma.$transaction(async (tx: any) => {
      for (const it of items) {
        const inv = await tx.inventoryItem.findUnique({ where: { productId: it.productId } });
        if (!inv || inv.quantity < it.quantity) {
          throw new Error(`Not enough inventory for one of the selected products (have ${inv?.quantity ?? 0}, need ${it.quantity}).`);
        }
        await tx.inventoryItem.update({ where: { id: inv.id }, data: { quantity: { decrement: it.quantity } } });
      }

      const shipmentNumber = "OUT-" + Math.floor(100000 + Math.random() * 899999);
      const created = await tx.outboundShipment.create({
        data: {
          shipmentNumber,
          userId,
          channel: channel === "AMAZON" ? "AMAZON" : "MANUAL",
          polybagQty,
          bundleQty,
          insertQty,
          tier: quote.tier,
          rateApplied: quote.rate,
          subtotal: quote.subtotal,
          tax: quote.tax,
          total: quote.total,
          status: "IN_PREP", // admin is creating this because work is starting now
          items: { create: items.map((it: any) => ({ productId: it.productId, quantity: it.quantity })) },
        },
        include: { items: { include: { product: true } } },
      });

      await tx.walletTransaction.create({
        data: {
          userId,
          type: "CHARGE",
          amount: -quote.total,
          description: `Shipment ${shipmentNumber} (${totalUnitsInThisShipment} units, ${quote.tier} tier) — created by staff`,
          outboundId: created.id,
        },
      });

      return created;
    });

    return NextResponse.json({ shipment });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not create shipment." }, { status: 400 });
  }
}
