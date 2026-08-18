"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminInventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/admin/inventory").then((r) => r.json()).then((d) => setItems(d.items ?? []));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Inventory — all customers</h1>
      <div className="card divide-y divide-border">
        {items.length === 0 && <div className="p-5 text-sm text-muted">Nothing in the warehouse yet.</div>}
        {items.map((it) => (
          <div key={it.id} className="p-4 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{it.product.title} <span className="text-muted font-normal">· {it.user.name}</span></div>
                <div className="text-xs text-muted">SKU: {it.product.sku} · in since {new Date(it.receivedAt).toLocaleDateString()}</div>
              </div>
              <div className="text-right">
                <div className="font-display font-bold">{it.quantity}</div>
                <Link href={`/admin/outbound/new?userId=${it.userId}`} className="text-xs text-accent2">Ship this →</Link>
              </div>
            </div>
            {it.sources?.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border text-xs text-muted">
                Received via: {it.sources.map((s: any, i: number) => (
                  <span key={i}>
                    <Link href={`/admin/inbound/${s.inboundId || ""}`} className="text-accent2">{s.shipmentNumber}</Link>
                    {" "}({s.receivedQty} units, {new Date(s.receivedAt).toLocaleDateString()})
                    {i < it.sources.length - 1 ? ", " : ""}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
