import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shipment = await prisma.inboundShipment.findUnique({
    where: { id: params.id },
    include: { items: { include: { product: true } }, user: { select: { name: true, email: true } } },
  });
  if (!shipment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (shipment.userId !== session.userId && session.role === "CUSTOMER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ shipment });
}
