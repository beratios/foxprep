import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { sendOutboundStatusEmail } from "@/lib/email";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status, trackingCarrier, trackingNumber, warehouseNotes } = await req.json();

  const existing = await prisma.outboundShipment.findUnique({
    where: { id: params.id },
    include: { items: true, user: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isCancelling = status === "CANCELLED" && existing.status !== "CANCELLED";

  const shipment = await prisma.$transaction(async (tx: any) => {
    const updated = await tx.outboundShipment.update({
      where: { id: params.id },
      data: { status, trackingCarrier, trackingNumber, warehouseNotes },
    });

    // Cancelling a shipment puts the reserved units back into inventory —
    // no wallet refund needed since outbound shipments aren't charged
    // (the stock was already paid for at inbound-receiving time).
    if (isCancelling) {
      for (const item of existing.items) {
        await tx.inventoryItem.upsert({
          where: { productId: item.productId },
          update: { quantity: { increment: item.quantity } },
          create: { userId: existing.userId, productId: item.productId, quantity: item.quantity },
        });
      }
    }

    return updated;
  });

  if (status && status !== existing.status) {
    await sendOutboundStatusEmail(existing.user.email, existing.user.name, existing.shipmentNumber, status);
  }

  return NextResponse.json({ shipment });
}
