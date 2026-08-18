import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { quoteOutbound, DEFAULT_RATES } from "@/lib/pricing";

// Read-only preview — computes the real quote (using actual rolling 30-day
// volume and current pricing settings) WITHOUT creating a shipment or
// touching inventory/wallet. Used by the new-shipment form for a live total
// that matches what /api/outbound will actually charge.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { units, polybagQty = 0, bundleQty = 0, insertQty = 0, targetUserId } = await req.json();

  // Admins/staff can preview a quote for a specific customer (e.g. when
  // creating an outbound shipment on their behalf) — regular customers can
  // only ever quote themselves.
  const effectiveUserId =
    targetUserId && (session.role === "ADMIN" || session.role === "STAFF") ? targetUserId : session.userId;

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const priorShipments = await prisma.outboundShipment.findMany({
    where: { userId: effectiveUserId, createdAt: { gte: since }, status: { not: "CANCELLED" } },
    include: { items: true },
  });
  const rolling30DayUnits = priorShipments.reduce((sum: number, s: any) => sum + s.items.reduce((si: number, it: any) => si + it.quantity, 0), 0);

  const settings = await prisma.pricingSetting.findUnique({ where: { id: "default" } });
  const quote = quoteOutbound(units || 0, rolling30DayUnits, { polybagQty, bundleQty, insertQty }, settings ?? DEFAULT_RATES);

  return NextResponse.json({ quote, rolling30DayUnits });
}
