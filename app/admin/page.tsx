import { prisma } from "@/lib/prisma";

export default async function AdminOverview() {
  const [customerCount, shipmentCount, openTickets, allTx, discrepancies, openRemovals] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.outboundShipment.count(),
    prisma.ticket.count({ where: { status: { not: "CLOSED" } } }),
    prisma.walletTransaction.findMany(),
    prisma.inboundShipment.count({ where: { status: "DISCREPANCY" } }),
    prisma.removalRequest.count({ where: { status: { in: ["REQUESTED", "IN_PROGRESS"] } } }),
  ]);
  const revenue = allTx.filter((t: any) => t.type === "CHARGE").reduce((s: number, t: any) => s + Math.abs(t.amount), 0);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-8">Admin overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Stat label="Customers" value={customerCount} />
        <Stat label="Total shipments" value={shipmentCount} />
        <Stat label="Open tickets" value={openTickets} />
        <Stat label="Revenue (charges)" value={`$${revenue.toFixed(2)}`} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {discrepancies > 0 && (
          <div className="card p-5 border-red-500/40">
            <div className="label mb-2 text-red-400">INBOUND DISCREPANCIES</div>
            <div className="font-display text-2xl font-bold text-red-400">{discrepancies}</div>
          </div>
        )}
        {openRemovals > 0 && (
          <div className="card p-5">
            <div className="label mb-2">PENDING REMOVAL REQUESTS</div>
            <div className="font-display text-2xl font-bold text-accent">{openRemovals}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-5">
      <div className="label mb-2">{label.toUpperCase()}</div>
      <div className="font-display text-2xl font-bold text-accent">{value}</div>
    </div>
  );
}
