import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shipments = await prisma.outboundShipment.findMany({
    where: { userId: session.userId },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ shipments });
}

// Body: { channel, items: [{ productId, quantity }] }
// NOT billed — the stock being shipped here was already paid for as prep
// fees when it was received (see /api/inbound/[id]/pay). This just validates
// against live inventory and decrements it (reserves the stock for shipping).
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { channel, items } = await req.json();
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "At least one product line is required." }, { status: 400 });
  }

  const totalUnitsInThisShipment = items.reduce((s: number, it: any) => s + (it.quantity || 0), 0);
  if (totalUnitsInThisShipment < 1) {
    return NextResponse.json({ error: "Quantity must be at least 1." }, { status: 400 });
  }

  try {
    const shipment = await prisma.$transaction(async (tx: any) => {
      // Check + decrement inventory per line, inside the transaction so two
      // concurrent requests can't both oversell the same stock.
      for (const it of items) {
        const inv = await tx.inventoryItem.findUnique({ where: { productId: it.productId } });
        if (!inv || inv.quantity < it.quantity) {
          throw new Error(`Not enough inventory for one of the selected products (have ${inv?.quantity ?? 0}, need ${it.quantity}).`);
        }
        await tx.inventoryItem.update({ where: { id: inv.id }, data: { quantity: { decrement: it.quantity } } });
      }

      const shipmentNumber = "OUT-" + Math.floor(100000 + Math.random() * 899999);
      return tx.outboundShipment.create({
        data: {
          shipmentNumber,
          userId: session.userId,
          channel: channel === "AMAZON" ? "AMAZON" : "MANUAL",
          subtotal: 0,
          tax: 0,
          total: 0,
          items: { create: items.map((it: any) => ({ productId: it.productId, quantity: it.quantity })) },
        },
        include: { items: { include: { product: true } } },
      });
    });

    return NextResponse.json({ shipment });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not create shipment." }, { status: 400 });
  }
}
