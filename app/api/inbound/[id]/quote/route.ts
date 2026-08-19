import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { quotePrepWork, DEFAULT_RATES } from "@/lib/pricing";

// Read-only preview of the prep fee for a RECEIVED inbound shipment, given
// chosen add-on quantities. Does not charge anything.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const inbound = await prisma.inboundShipment.findUnique({ where: { id: params.id }, include: { items: true } });
  if (!inbound) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (inbound.userId !== session.userId && session.role === "CUSTOMER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { polybagQty = 0, bundleQty = 0, insertQty = 0 } = await req.json();
  const receivedUnits = inbound.items.reduce((s: number, it: any) => s + (it.receivedQty ?? 0), 0);

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const priorShipments = await prisma.inboundShipment.findMany({
    where: { userId: inbound.userId, paidAt: { not: null, gte: since } },
    include: { items: true },
  });
  const rolling30DayUnits = priorShipments.reduce(
    (sum: number, s: any) => sum + s.items.reduce((si: number, it: any) => si + (it.receivedQty ?? 0), 0),
    0
  );

  const settings = await prisma.pricingSetting.findUnique({ where: { id: "default" } });
  const quote = quotePrepWork(receivedUnits, rolling30DayUnits, { polybagQty, bundleQty, insertQty }, settings ?? DEFAULT_RATES);

  return NextResponse.json({ quote, receivedUnits });
}
