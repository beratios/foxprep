import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const removals = await prisma.removalRequest.findMany({
    where: { userId: session.userId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ removals });
}

// Body: { productId, quantity, notes? }
// Does NOT touch inventory yet — that happens when staff marks it COMPLETED,
// mirroring the physical reality that the units are still sitting in the
// warehouse until someone actually pulls and ships them back.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId, quantity, notes } = await req.json();
  if (!productId || !quantity || quantity < 1) {
    return NextResponse.json({ error: "Product and quantity are required." }, { status: 400 });
  }

  const inv = await prisma.inventoryItem.findUnique({ where: { productId } });
  if (!inv || inv.quantity < quantity) {
    return NextResponse.json({ error: `You only have ${inv?.quantity ?? 0} units of this product in inventory.` }, { status: 400 });
  }

  const removal = await prisma.removalRequest.create({
    data: { userId: session.userId, productId, quantity, notes },
  });
  return NextResponse.json({ removal });
}
