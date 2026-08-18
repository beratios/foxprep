import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { sendInboundReceivedEmail } from "@/lib/email";

// Body: { items: [{ itemId, receivedQty }] }
// Marks the shipment RECEIVED (or DISCREPANCY if any line doesn't match
// expected), and credits the received quantities into each product's
// InventoryItem — this is the only place stock enters inventory.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { items } = await req.json();
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "At least one received quantity is required." }, { status: 400 });
  }

  const shipment = await prisma.inboundShipment.findUnique({
    where: { id: params.id },
    include: { items: true, user: true },
  });
  if (!shipment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let hasDiscrepancy = false;

  await prisma.$transaction(async (tx: any) => {
    for (const line of items) {
      const item = shipment.items.find((i: any) => i.id === line.itemId);
      if (!item) continue;

      await tx.inboundShipmentItem.update({
        where: { id: item.id },
        data: { receivedQty: line.receivedQty },
      });

      if (line.receivedQty !== item.expectedQty) hasDiscrepancy = true;

      if (line.receivedQty > 0) {
        const existing = await tx.inventoryItem.findUnique({
          where: { productId: item.productId },
        });
        await tx.inventoryItem.upsert({
          where: { productId: item.productId },
          update: {
            quantity: { increment: line.receivedQty },
            // Only reset the storage clock if this product had zero stock —
            // topping up an existing pile shouldn't restart the free window
            // for units that were already sitting there.
            ...(existing && existing.quantity > 0 ? {} : { receivedAt: new Date() }),
          },
          create: {
            userId: shipment.userId,
            productId: item.productId,
            quantity: line.receivedQty,
            receivedAt: new Date(),
          },
        });
      }
    }

    await tx.inboundShipment.update({
      where: { id: params.id },
      data: { status: hasDiscrepancy ? "DISCREPANCY" : "RECEIVED", receivedAt: new Date() },
    });
  });

  await sendInboundReceivedEmail(shipment.user.email, shipment.user.name, shipment.shipmentNumber, hasDiscrepancy);

  return NextResponse.json({ ok: true, hasDiscrepancy });
}
