import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status } = await req.json();
  const removal = await prisma.removalRequest.findUnique({ where: { id: params.id } });
  if (!removal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only decrement inventory the moment it's actually marked COMPLETED — not
  // on REQUESTED or IN_PROGRESS, since the stock is still physically there.
  if (status === "COMPLETED" && removal.status !== "COMPLETED") {
    await prisma.$transaction(async (tx: any) => {
      await tx.inventoryItem.update({
        where: { productId: removal.productId },
        data: { quantity: { decrement: removal.quantity } },
      });
      await tx.removalRequest.update({ where: { id: params.id }, data: { status } });
    });
  } else {
    await prisma.removalRequest.update({ where: { id: params.id }, data: { status } });
  }

  return NextResponse.json({ ok: true });
}
