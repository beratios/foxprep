import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { postTransaction } from "@/lib/wallet";

/** Manual balance adjustment, e.g. an e-Transfer received or a custom-rate refund. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (s?.role !== "ADMIN") return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const { amount, description } = await req.json().catch(() => ({}));
  const cents = Math.round(Number(amount) * 100);
  if (!cents || !description) return NextResponse.json({ error: "Enter an amount and a reason." }, { status: 400 });
  const t = await prisma.$transaction((tx) => postTransaction(tx, { userId: params.id, type: "ADJUSTMENT", amountCents: cents, description: String(description).slice(0, 200) }));
  if (!t) return NextResponse.json({ error: "That would make the balance negative." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
