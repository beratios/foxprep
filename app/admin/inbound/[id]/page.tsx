"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function AdminInboundDetail() {
  const { id } = useParams<{ id: string }>();
  const [shipment, setShipment] = useState<any>(null);
  const [received, setReceived] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string>("");

  async function load() {
    const res = await fetch(`/api/inbound/${id}`);
    const data = await res.json();
    setShipment(data.shipment);
    const init: Record<string, number> = {};
    data.shipment?.items.forEach((it: any) => { init[it.id] = it.receivedQty ?? it.expectedQty; });
    setReceived(init);
  }
  useEffect(() => { load(); }, [id]);

  async function submitReceive() {
    setSubmitting(true);
    const res = await fetch(`/api/admin/inbound/${id}/receive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: Object.entries(received).map(([itemId, receivedQty]) => ({ itemId, receivedQty })) }),
    });
    const data = await res.json();
    setSubmitting(false);
    setResult(data.hasDiscrepancy ? "Received — with a quantity mismatch, flagged for review." : "Received — inventory updated.");
    load();
  }

  if (!shipment) return <div className="text-muted text-sm">Loading…</div>;

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-bold mb-1">{shipment.shipmentNumber}</h1>
      <p className="text-muted text-sm mb-6">{shipment.user.name} · {shipment.user.email}</p>

      <div className="card p-5 space-y-4">
        {shipment.items.map((it: any) => (
          <div key={it.id} className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-sm">{it.product.title}</div>
              <div className="text-xs text-muted">Expected: {it.expectedQty}</div>
            </div>
            <input
              type="number"
              min={0}
              className="input"
              style={{ width: 90 }}
              value={received[it.id] ?? ""}
              onChange={(e) => setReceived({ ...received, [it.id]: +e.target.value })}
              disabled={shipment.status !== "EXPECTED"}
            />
          </div>
        ))}
        {shipment.status === "EXPECTED" ? (
          <button onClick={submitReceive} disabled={submitting} className="btn-primary w-full">
            {submitting ? "Saving…" : "Mark received & update inventory"}
          </button>
        ) : (
          <p className="text-xs text-accent2">Already processed: {shipment.status}</p>
        )}
        {result && <p className="text-xs text-muted">{result}</p>}
      </div>
    </div>
  );
}
