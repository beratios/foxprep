"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Item = { id: string; quantity: number; receivedAt: string; product: { id: string; sku: string; title: string; photoUrl: string | null } };

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    fetch("/api/inventory").then((r) => r.json()).then((d) => setItems(d.items ?? []));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Inventory</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/inbound/new" className="btn-secondary text-xs px-4 py-2">Send stock in</Link>
          <Link href="/dashboard/outbound/new" className="btn-primary text-xs px-4 py-2">New shipment</Link>
        </div>
      </div>
      <p className="text-muted text-sm mb-6">What's currently sitting in the FoxPrep warehouse, ready to ship.</p>

      <div className="card divide-y divide-border">
        {items.length === 0 && (
          <div className="p-6 text-sm text-muted">
            Nothing in inventory yet. <Link href="/dashboard/inbound/new" className="text-accent2">Send stock in</Link> to get started.
          </div>
        )}
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-4 p-4 text-sm">
            {it.product.photoUrl ? (
              <img src={it.product.photoUrl} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-[#181b20] flex items-center justify-center text-lg">📦</div>
            )}
            <div className="flex-1">
              <div className="font-semibold">{it.product.title}</div>
              <div className="text-xs text-muted">SKU: {it.product.sku} · in since {new Date(it.receivedAt).toLocaleDateString()}</div>
            </div>
            <div className="text-right font-display font-bold text-lg">{it.quantity}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
