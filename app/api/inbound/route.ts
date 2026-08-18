import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shipments = await prisma.inboundShipment.findMany({
    where: { userId: session.userId },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ shipments });
}

// Body: { notes?, items: [{ productId, expectedQty }] }
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { notes, items } = await req.json();
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "At least one product line is required." }, { status: 400 });
  }
  for (const it of items) {
    if (!it.productId || !it.expectedQty || it.expectedQty < 1) {
      return NextResponse.json({ error: "Each line needs a product and a quantity of at least 1." }, { status: 400 });
    }
  }

  const shipmentNumber = "IN-" + Math.floor(100000 + Math.random() * 899999);
  const shipment = await prisma.inboundShipment.create({
    data: {
      shipmentNumber,
      userId: session.userId,
      notes,
      items: { create: items.map((it: any) => ({ productId: it.productId, expectedQty: it.expectedQty })) },
    },
    include: { items: { include: { product: true } } },
  });

  return NextResponse.json({ shipment });
}
