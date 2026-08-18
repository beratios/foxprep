"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const STATUS_COLOR: Record<string, string> = {
  QUEUED: "text-muted", IN_PREP: "text-accent2", READY_TO_SHIP: "text-accent",
  SHIPPED: "text-accent", COMPLETED: "text-green-400", CANCELLED: "text-red-400",
};

export default function OutboundListPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/outbound").then((r) => r.json()).then((d) => setShipments(d.shipments ?? []));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Outbound shipments</h1>
        <Link href="/dashboard/outbound/new" className="btn-primary text-xs px-4 py-2">New shipment</Link>
      </div>
      <div className="card divide-y divide-border">
        {shipments.length === 0 && <div className="p-6 text-sm text-muted">No outbound shipments yet.</div>}
        {shipments.map((s) => (
          <Link key={s.id} href={`/dashboard/outbound/${s.id}`} className="flex items-center justify-between p-4 hover:bg-[#161a1f] text-sm">
            <div>
              <div className="font-semibold">{s.shipmentNumber}</div>
              <div className="text-xs text-muted">
                {new Date(s.createdAt).toLocaleDateString()} · {s.items.reduce((n: number, it: any) => n + it.quantity, 0)} units · {s.channel} · {s.tier}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">${s.total.toFixed(2)}</div>
              <div className={`text-xs ${STATUS_COLOR[s.status] || "text-muted"}`}>{s.status.replaceAll("_", " ")}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
