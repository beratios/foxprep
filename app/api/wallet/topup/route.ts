import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createTopUpCheckoutSession } from "@/lib/stripe";

// Real Stripe checkout flow — will throw a clear error until STRIPE_SECRET_KEY
// is set (see lib/stripe.ts). Use /api/wallet/demo-topup for testing until then.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amountCad } = await req.json();
  if (!amountCad || amountCad < 10) {
    return NextResponse.json({ error: "Minimum top-up is $10 CAD." }, { status: 400 });
  }

  try {
    const origin = req.headers.get("origin") || "";
    const checkout = await createTopUpCheckoutSession({
      userId: session.userId,
      amountCad,
      successUrl: `${origin}/dashboard/wallet?topup=success`,
      cancelUrl: `${origin}/dashboard/wallet?topup=cancelled`,
    });
    return NextResponse.json({ url: checkout.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 501 });
  }
}
