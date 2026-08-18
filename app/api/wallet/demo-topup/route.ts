import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// DEV/DEMO ONLY — credits the wallet directly without a real payment, so the
// order flow can be tested before Stripe is wired up. Disabled in production.
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Demo top-up is disabled in production." }, { status: 403 });
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
