"use client";
import { useEffect, useState } from "react";

const STATUS_COLOR: Record<string, string> = {
  REQUESTED: "text-muted", IN_PROGRESS: "text-accent2", COMPLETED: "text-green-400", CANCELLED: "text-red-400",
};

export default function RemovalsPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [removals, setRemovals] = useState<any[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const [inv, rem] = await Promise.all([
      fetch("/api/inventory").then((r) => r.json()),
      fetch("/api/removals").then((r) => r.json()),
    ]);
    setInventory(inv.items ?? []);
    setRemovals(rem.removals ?? []);
  }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await fetch("/api/removals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity, notes }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(data.error); return; }
    setProductId(""); setQuantity(1); setNotes(""); setOpen(false);
    load();
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Removals</h1>
        <button onClick={() => setOpen(!open)} className="btn-primary text-xs px-4 py-2">{open ? "Cancel" : "Request removal"}</button>
      </div>
      <p className="text-muted text-sm mb-6">
        Want stock pulled back out of the warehouse instead of shipped onward? Request it here.
      </p>

      {open && (
        <form onSubmit={submit} className="card p-5 mb-6 space-y-3">
          <div>
            <label className="label mb-1 block">Product</label>
            <select className="input" value={productId} onChange={(e) => setProductId(e.target.value)} required>
              <option value="">Select…</option>
              {inventory.map((i) => <option key={i.id} value={i.product.id}>{i.product.title} ({i.quantity} in stock)</option>)}
            </select>
          </div>
          <div>
            <label className="label mb-1 block">Quantity</label>
            <input type="number" min={1} className="input" value={quantity} onChange={(e) => setQuantity(Math.max(1, +e.target.value))} />
          </div>
          <div>
            <label className="label mb-1 block">Notes (optional)</label>
            <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button className="btn-primary" disabled={submitting}>{submitting ? "Submitting…" : "Submit request"}</button>
        </form>
      )}

      <div className="card divide-y divide-border">
        {removals.length === 0 && <div className="p-5 text-sm text-muted">No removal requests yet.</div>}
        {removals.map((r) => (
          <div key={r.id} className="flex items-center justify-between p-4 text-sm">
            <div>
              <div className="font-semibold">{r.product.title}</div>
              <div className="text-xs text-muted">{r.quantity} units · {new Date(r.createdAt).toLocaleDateString()}</div>
            </div>
            <span className={`text-xs ${STATUS_COLOR[r.status] || "text-muted"}`}>{r.status.replaceAll("_", " ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
