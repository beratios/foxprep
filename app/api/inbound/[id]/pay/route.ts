import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { quotePrepWork, DEFAULT_RATES } from "@/lib/pricing";

// Charges the customer's wallet for prep work on a RECEIVED inbound
// shipment, BEFORE any physical prep happens. This is the only place
// inbound shipments get charged — outbound shipments are free (the stock
// was already paid for here).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const inbound = await prisma.inboundShipment.findUnique({ where: { id: params.id }, include: { items: true } });
  if (!inbound) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (inbound.userId !== session.userId && session.role === "CUSTOMER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (inbound.status === "EXPECTED") {
    return NextResponse.json({ error: "This shipment hasn't been received yet." }, { status: 400 });
  }
  if (inbound.paidAt) {
    return NextResponse.json({ error: "This shipment has already been paid for." }, { status: 409 });
  }

  const { polybagQty = 0, bundleQty = 0, insertQty = 0 } = await req.json();
  const receivedUnits = inbound.items.reduce((s: number, it: any) => s + (it.receivedQty ?? 0), 0);
  if (receivedUnits < 1) {
    return NextResponse.json({ error: "No received units to charge for." }, { status: 400 });
  }

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
  const rates = settings ?? DEFAULT_RATES;
  const quote = quotePrepWork(receivedUnits, rolling30DayUnits, { polybagQty, bundleQty, insertQty }, rates);

  const walletAgg = await prisma.walletTransaction.aggregate({ where: { userId: inbound.userId }, _sum: { amount: true } });
  const balance = walletAgg._sum.amount ?? 0;
  if (balance < quote.total) {
    return NextResponse.json(
      { error: "Insufficient wallet balance. Top up before paying for this shipment.", required: quote.total, balance },
      { status: 402 }
    );
  }

  const updated = await prisma.$transaction(async (tx: any) => {
    const result = await tx.inboundShipment.update({
      where: { id: params.id },
      data: {
        polybagQty,
        bundleQty,
        insertQty,
        tier: quote.tier,
        rateApplied: quote.rate,
        subtotal: quote.subtotal,
        tax: quote.tax,
        total: quote.total,
        paidAt: new Date(),
      },
    });

    await tx.walletTransaction.create({
      data: {
        userId: inbound.userId,
        type: "CHARGE",
        amount: -quote.total,
        description: `Prep fee — ${inbound.shipmentNumber} (${receivedUnits} units, ${quote.tier} tier)`,
        inboundId: inbound.id,
      },
    });

    return result;
  });

  return NextResponse.json({ inbound: updated });
}
