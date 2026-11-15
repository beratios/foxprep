import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { PaymentError, orderCheckoutUrl, payOrderWithWallet } from "@/lib/orders";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Log in again." }, { status: 401 });
  const { method } = await req.json().catch(() => ({}));
  try {
    if (method === "STRIPE") return NextResponse.json({ url: await orderCheckoutUrl(params.id, session.uid) });
    await payOrderWithWallet(params.id, session.uid);
    return NextResponse.json({ url: `/dashboard/orders/${params.id}?placed=1` });
  } catch (e) {
    return NextResponse.json({ error: e instanceof PaymentError ? e.message : "Payment failed." }, { status: 402 });
  }
}
