import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// Manual wallet adjustment by admin (refunds, corrections, goodwill credit).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { amount, description } = await req.json();
  if (!amount || !description) {
    return NextResponse.json({ error: "Amount and description are required." }, { status: 400 });
  }

  await prisma.walletTransaction.create({
    data: { userId: params.id, type: "ADJUSTMENT", amount, description },
  });

  return NextResponse.json({ ok: true });
}
