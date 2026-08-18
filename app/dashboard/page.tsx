import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";

export default async function DashboardOverview() {
  const user = await requireUser();

  const [agg, recentShipments, openTickets, inventoryCount] = await Promise.all([
    prisma.walletTransaction.aggregate({ where: { userId: user.id }, _sum: { amount: true } }),
    prisma.outboundShipment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.ticket.count({ where: { userId: user.id, status: { not: "CLOSED" } } }),
    prisma.inventoryItem.count({ where: { userId: user.id, quantity: { gt: 0 } } }),
  ]);
  const balance = agg._sum.amount ?? 0;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-1">Welcome back, {user.name.split(" ")[0]}</h1>
      <p className="text-muted text-sm mb-8">Here's what's happening with your account.</p>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-10">
        <div className="card p-5">
          <div className="label mb-2">Wallet balance</div>
          <div className="font-display text-2xl font-bold text-accent">${balance.toFixed(2)} CAD</div>
          <Link href="/dashboard/wallet" className="text-xs text-accent2 mt-2 inline-block">Top up →</Link>
        </div>
        <div className="card p-5">
          <div className="label mb-2">In inventory</div>
          <div className="font-display text-2xl font-bold">{inventoryCount} SKUs</div>
          <Link href="/dashboard/inventory" className="text-xs text-accent2 mt-2 inline-block">View →</Link>
        </div>
        <div className="card p-5">
          <div className="label mb-2">Amazon integration</div>
          <div className="font-display text-lg font-bold">{user.amazonConnected ? "Connected" : "Not connected"}</div>
          <Link href="/dashboard/settings" className="text-xs text-accent2 mt-2 inline-block">Manage →</Link>
        </div>
        <div className="card p-5">
          <div className="label mb-2">Open tickets</div>
          <div className="font-display text-2xl font-bold">{openTickets}</div>
          <Link href="/dashboard/tickets" className="text-xs text-accent2 mt-2 inline-block">View →</Link>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold">Recent outbound shipments</h2>
        <div className="flex gap-2">
          <Link href="/dashboard/inbound/new" className="btn-secondary text-xs px-4 py-2">Send stock in</Link>
          <Link href="/dashboard/outbound/new" className="btn-primary text-xs px-4 py-2">New shipment</Link>
        </div>
      </div>
      <div className="card divide-y divide-border">
        {recentShipments.length === 0 && <div className="p-5 text-sm text-muted">No shipments yet. Send stock in, then create your first outbound shipment.</div>}
        {recentShipments.map((s: any) => (
          <Link key={s.id} href={`/dashboard/outbound/${s.id}`} className="flex items-center justify-between p-4 hover:bg-[#161a1f] text-sm">
            <div>
              <div className="font-semibold">{s.shipmentNumber}</div>
              <div className="text-xs text-muted">{s.channel} · {s.tier} tier</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">${s.total.toFixed(2)}</div>
              <div className="text-xs text-muted">{s.status.replaceAll("_", " ")}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
