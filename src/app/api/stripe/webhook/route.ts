import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { fulfillCheckout } from "@/lib/orders";

export async function POST(req: Request) {
  const s = stripe();
  if (!s || !process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = s.webhooks.constructEvent(await req.text(), req.headers.get("stripe-signature") || "", process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await fulfillCheckout(event.data.object as Stripe.Checkout.Session);
  }
  return NextResponse.json({ received: true });
}
