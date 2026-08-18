import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: {
      _count: { select: { outboundShipments: true } },
      walletTx: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const withBalance = customers.map((c: any) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    amazonConnected: c.amazonConnected,
    emailVerified: c.emailVerified,
    shipmentCount: c._count.outboundShipments,
    balance: c.walletTx.reduce((sum: number, t: any) => sum + t.amount, 0),
    createdAt: c.createdAt,
  }));

  return NextResponse.json({ customers: withBalance });
}
