// Stripe integration — WALLET TOP-UPS ONLY.
//
// TODO before going live:
//   1. Create a Stripe account, get keys from dashboard.stripe.com/apikeys
//   2. Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env
//   3. Create a webhook endpoint pointing to /api/stripe/webhook, listening
//      for "checkout.session.completed", and set STRIPE_WEBHOOK_SECRET
//   4. Remove the `if (!stripe)` guards once keys are in place — they exist
//      only so the app doesn't crash before Stripe is configured.

import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
  : null;

export async function createTopUpCheckoutSession(params: {
  userId: string;
  amountCad: number;
  successUrl: string;
  cancelUrl: string;
}) {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured yet. Add STRIPE_SECRET_KEY to .env — see lib/stripe.ts for setup steps."
    );
  }
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "cad",
          product_data: { name: "FoxPrep wallet top-up" },
          unit_amount: Math.round(params.amountCad * 100),
        },
        quantity: 1,
      },
    ],
    metadata: { userId: params.userId, kind: "wallet_topup" },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });
  return session;
}
