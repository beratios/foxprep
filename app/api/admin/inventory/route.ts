import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const items = await prisma.inventoryItem.findMany({
    where: { quantity: { gt: 0 } },
    include: { product: true, user: { select: { name: true, email: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ items });
}
