import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { PaymentError, topUpCheckoutUrl } from "@/lib/orders";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Log in again." }, { status: 401 });
  const { amount } = await req.json().catch(() => ({}));
  const cents = Math.round(Number(amount) * 100);
  if (!Number.isFinite(cents) || cents < 2000 || cents > 5_000_000)
    return NextResponse.json({ error: "Enter an amount between $20 and $50,000." }, { status: 400 });
  try {
    return NextResponse.json({ url: await topUpCheckoutUrl(user.id, user.email, cents) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof PaymentError ? e.message : "Could not start the payment." }, { status: 400 });
  }
}
