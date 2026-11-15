import Stripe from "stripe";

let client: Stripe | null = null;
export function stripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

export const appUrl = () => (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
