"use client";
import { useEffect, useState } from "react";

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
          <div key={it.id} className="flex items-center justify-between p-4 text-sm">
            <div>
              <div className="font-semibold">{it.product.title} <span className="text-muted font-normal">· {it.user.name}</span></div>
              <div className="text-xs text-muted">SKU: {it.product.sku} · in since {new Date(it.receivedAt).toLocaleDateString()}</div>
            </div>
            <div className="font-display font-bold">{it.quantity}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
