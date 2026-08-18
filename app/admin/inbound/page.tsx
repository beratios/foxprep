"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const STATUS_COLOR: Record<string, string> = {
  EXPECTED: "text-muted", RECEIVED: "text-green-400", DISCREPANCY: "text-red-400",
};

export default function AdminInboundPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/admin/inbound").then((r) => r.json()).then((d) => setShipments(d.shipments ?? []));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Inbound shipments</h1>
      <div className="card divide-y divide-border">
        {shipments.length === 0 && <div className="p-5 text-sm text-muted">No inbound shipments yet.</div>}
        {shipments.map((s) => (
          <Link key={s.id} href={`/admin/inbound/${s.id}`} className="flex items-center justify-between p-4 hover:bg-[#161a1f] text-sm">
            <div>
              <div className="font-semibold">{s.shipmentNumber} <span className="text-muted font-normal">· {s.user.name}</span></div>
              <div className="text-xs text-muted">{new Date(s.createdAt).toLocaleDateString()} · {s.items.length} product(s)</div>
            </div>
            <span className={`text-xs ${STATUS_COLOR[s.status] || "text-muted"}`}>{s.status}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
