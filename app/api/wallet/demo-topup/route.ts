import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// TEST-MODE ONLY — credits the wallet directly without a real payment, so
// the shipment/payment flow can be tested before Stripe is wired up. Gated
// on whether Stripe is configured (not on NODE_ENV) so it works on the live
// Vercel deployment during setup, and automatically disables itself the
// moment STRIPE_SECRET_KEY is added to the environment.
export async function POST(req: NextRequest) {
  if (process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is configured — use real card top-up instead of demo top-up." }, { status: 403 });
  }
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amountCad } = await req.json();
  if (!amountCad || amountCad <= 0) {
    return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
  }

  await prisma.walletTransaction.create({
    data: {
      userId: session.userId,
      type: "TOPUP",
      amount: amountCad,
      description: "Demo top-up (test mode, no real payment)",
    },
  });

  return NextResponse.json({ ok: true });
}
