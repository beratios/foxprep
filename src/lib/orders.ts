import type Stripe from "stripe";
import { prisma } from "./db";
import { postTransaction, creditTopUp } from "./wallet";
import { stripe, appUrl } from "./stripe";

export class PaymentError extends Error {}

/** Charge an unpaid order from the customer's balance. */
export async function payOrderWithWallet(orderId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new PaymentError("Order not found.");
    if (order.paidAt) return order;
    const t = await postTransaction(tx, {
      userId,
      type: "CHARGE",
      amountCents: -order.totalCents,
      description: `Order ${order.ref}`,
      orderId: order.id,
    });
    if (!t) throw new PaymentError("Your balance is too low for this order. Top up or pay by card.");
    const paid = await tx.order.update({
      where: { id: order.id },
      data: { paidAt: new Date(), paymentMethod: "WALLET", status: "AWAITING_INBOUND" },
    });
    await tx.orderEvent.create({ data: { orderId: order.id, status: "AWAITING_INBOUND", note: "Paid from balance" } });
    return paid;
  });
}

export async function orderCheckoutUrl(orderId: string, userId: string) {
  const s = stripe();
  if (!s) throw new PaymentError("Card payments aren't set up yet. Pay from your balance instead.");
  const order = await prisma.order.findFirst({ where: { id: orderId, userId }, include: { user: true } });
  if (!order) throw new PaymentError("Order not found.");
  const session = await s.checkout.sessions.create({
    mode: "payment",
    customer_email: order.user.email,
    client_reference_id: order.userId,
    metadata: { kind: "order", orderId: order.id, userId: order.userId },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "cad",
          unit_amount: order.subtotalCents,
          product_data: { name: `FoxPrep order ${order.ref}`, description: `${order.channel} prep, ${order.units} units` },
        },
      },
      {
        quantity: 1,
        price_data: { currency: "cad", unit_amount: order.taxCents, product_data: { name: "HST 13% (Ontario)" } },
      },
    ],
    success_url: `${appUrl()}/dashboard/orders/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}/dashboard/orders/${order.id}`,
  });
  await prisma.order.update({ where: { id: order.id }, data: { stripeSession: session.id } });
  return session.url!;
}

export async function topUpCheckoutUrl(userId: string, email: string, amountCents: number) {
  const s = stripe();
  if (!s) throw new PaymentError("Card payments aren't set up yet.");
  const session = await s.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    client_reference_id: userId,
    metadata: { kind: "topup", userId },
    line_items: [{ quantity: 1, price_data: { currency: "cad", unit_amount: amountCents, product_data: { name: "FoxPrep balance top-up" } } }],
    success_url: `${appUrl()}/dashboard/balance?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}/dashboard/balance`,
  });
  return session.url!;
}

/** Idempotent: safe to call from the webhook and from the success redirect. */
export async function fulfillCheckout(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return;
  const { kind, userId, orderId } = session.metadata || {};
  if (kind === "topup" && userId) {
    await creditTopUp(userId, session.amount_total ?? 0, session.id);
  } else if (kind === "order" && orderId) {
    await prisma.$transaction(async (tx) => {
      const o = await tx.order.findUnique({ where: { id: orderId } });
      if (!o || o.paidAt) return;
      await tx.order.update({
        where: { id: orderId },
        data: { paidAt: new Date(), paymentMethod: "STRIPE", status: "AWAITING_INBOUND", stripeSession: session.id },
      });
      await tx.orderEvent.create({ data: { orderId, status: "AWAITING_INBOUND", note: "Paid by card" } });
    });
  }
}

export async function confirmSession(sessionId: string) {
  const s = stripe();
  if (!s) return;
  try {
    await fulfillCheckout(await s.checkout.sessions.retrieve(sessionId));
  } catch {
    /* webhook will catch up */
  }
}
