"use client";
import { useEffect, useState } from "react";

const STATUSES = ["REQUESTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export default function AdminRemovalsPage() {
  const [removals, setRemovals] = useState<any[]>([]);

  async function load() {
    const res = await fetch("/api/admin/removals");
    const data = await res.json();
    setRemovals(data.removals ?? []);
  }
  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/removals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Removal requests</h1>
      <div className="card divide-y divide-border">
        {removals.length === 0 && <div className="p-5 text-sm text-muted">No removal requests.</div>}
        {removals.map((r) => (
          <div key={r.id} className="flex items-center justify-between p-4 text-sm">
            <div>
              <div className="font-semibold">{r.product.title} <span className="text-muted font-normal">· {r.user.name}</span></div>
              <div className="text-xs text-muted">{r.quantity} units · {new Date(r.createdAt).toLocaleDateString()} {r.notes && `· "${r.notes}"`}</div>
            </div>
            <select className="input" style={{ width: 160 }} value={r.status} onChange={(e) => updateStatus(r.id, e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
