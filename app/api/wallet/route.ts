import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [agg, transactions] = await Promise.all([
    prisma.walletTransaction.aggregate({ where: { userId: session.userId }, _sum: { amount: true } }),
    prisma.walletTransaction.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  return NextResponse.json({ balance: agg._sum.amount ?? 0, transactions });
}
