import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { postTransaction } from "@/lib/wallet";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Log in again." }, { status: 401 });
  const order = await prisma.order.findFirst({ where: { id: params.id, userId: session.uid } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (!["AWAITING_PAYMENT", "AWAITING_INBOUND"].includes(order.status))
    return NextResponse.json({ error: "This order is already at our warehouse. Message us to change it." }, { status: 409 });

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    await tx.orderEvent.create({ data: { orderId: order.id, status: "CANCELLED", note: order.paidAt ? "Cancelled, refunded to balance" : "Cancelled" } });
    if (order.paidAt)
      await postTransaction(tx, { userId: order.userId, type: "REFUND", amountCents: order.totalCents, description: `Refund for cancelled order ${order.ref}`, orderId: order.id });
  });
  return NextResponse.json({ ok: true });
}
