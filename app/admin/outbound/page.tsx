"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminOutboundPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/admin/outbound").then((r) => r.json()).then((d) => setShipments(d.shipments ?? []));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Outbound shipments</h1>
      <div className="card divide-y divide-border">
        {shipments.length === 0 && <div className="p-5 text-sm text-muted">No outbound shipments yet.</div>}
        {shipments.map((s) => (
          <Link key={s.id} href={`/admin/outbound/${s.id}`} className="flex items-center justify-between p-4 hover:bg-[#161a1f] text-sm">
            <div>
              <div className="font-semibold">{s.shipmentNumber} <span className="text-muted font-normal">· {s.user.name}</span></div>
              <div className="text-xs text-muted">
                {new Date(s.createdAt).toLocaleDateString()} · {s.items.reduce((n: number, it: any) => n + it.quantity, 0)} units · {s.channel}
              </div>
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
