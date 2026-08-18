import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = req.nextUrl.searchParams.get("userId") || undefined;

  const items = await prisma.inventoryItem.findMany({
    where: { quantity: { gt: 0 }, ...(userId ? { userId } : {}) },
    include: { product: true, user: { select: { name: true, email: true } } },
    orderBy: { updatedAt: "desc" },
  });

  // For traceability: which inbound shipment(s) actually brought this stock
  // in. A product can be topped up by more than one inbound over time, so
  // this is a list, not a single value.
  const withSources = await Promise.all(
    items.map(async (item: any) => {
      const sourceLines = await prisma.inboundShipmentItem.findMany({
        where: { productId: item.productId, receivedQty: { gt: 0 } },
        include: { inbound: { select: { id: true, shipmentNumber: true, receivedAt: true } } },
        orderBy: { inbound: { receivedAt: "desc" } },
      });
      return {
        ...item,
        sources: sourceLines.map((l: any) => ({
          inboundId: l.inbound.id,
          shipmentNumber: l.inbound.shipmentNumber,
          receivedAt: l.inbound.receivedAt,
          receivedQty: l.receivedQty,
        })),
      };
    })
  );

  return NextResponse.json({ items: withSources });
}
