import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// TODO: point your Stripe webhook at /api/stripe/webhook and set
// STRIPE_WEBHOOK_SECRET once the account is ready. This handler already
// contains the logic to credit the wallet on a completed checkout — it just
// needs real signature verification switched on below.
export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 501 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (!webhookSecret || !sig) throw new Error("Webhook secret not configured.");
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const userId = session.metadata?.userId;
    const amountCad = (session.amount_total ?? 0) / 100;
    if (userId && session.metadata?.kind === "wallet_topup") {
      await prisma.walletTransaction.create({
        data: {
          userId,
          type: "TOPUP",
          amount: amountCad,
          description: "Wallet top-up via Stripe",
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
