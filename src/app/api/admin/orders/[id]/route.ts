import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notifyStatus } from "@/lib/notify";

const Body = z.object({
  status: z.enum(["AWAITING_PAYMENT", "AWAITING_INBOUND", "RECEIVED", "IN_PREP", "SHIPPED", "COMPLETED", "CANCELLED"]),
  note: z.string().max(500).optional(),
  outboundTracking: z.string().max(500).optional(),
  adminNotes: z.string().max(5000).optional(),
  received: z.record(z.number().int().min(0)).optional(),
  notify: z.boolean().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (s?.role !== "ADMIN") return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  const b = p.data;
  const order = await prisma.order.findUnique({ where: { id: params.id }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    // Received counts move stock into our warehouse
    for (const item of order.items) {
      const qty = b.received?.[item.id];
      if (qty === undefined || qty === item.receivedQty) continue;
      await tx.orderItem.update({ where: { id: item.id }, data: { receivedQty: qty } });
      if (item.productId) await tx.product.update({ where: { id: item.productId }, data: { warehouseQty: { increment: qty - (item.receivedQty ?? 0) } } });
    }
    // FBA/WFS shipments leave the warehouse when marked shipped
    if (b.status === "SHIPPED" && order.status !== "SHIPPED" && order.channel !== "FBM") {
      for (const item of order.items) {
        if (item.productId) await tx.product.update({ where: { id: item.productId }, data: { warehouseQty: { decrement: b.received?.[item.id] ?? item.receivedQty ?? item.quantity } } });
      }
    }
    await tx.order.update({
      where: { id: order.id },
      data: { status: b.status, outboundTracking: b.outboundTracking || null, adminNotes: b.adminNotes || null },
    });
    if (b.status !== order.status || b.note) await tx.orderEvent.create({ data: { orderId: order.id, status: b.status, note: b.note || null } });
  });
  if (b.notify !== false && b.status !== order.status) await notifyStatus(order.id, b.note).catch(() => {});
  return NextResponse.json({ ok: true });
}
