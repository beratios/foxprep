import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.inventoryItem.findMany({
    where: { userId: session.userId, quantity: { gt: 0 } },
    include: { product: true },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ items });
}
