"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const STATUSES = ["QUEUED", "IN_PREP", "READY_TO_SHIP", "SHIPPED", "COMPLETED", "CANCELLED"];

export default function AdminOutboundDetail() {
  const { id } = useParams<{ id: string }>();
  const [s, setS] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load() {
    const res = await fetch(`/api/outbound/${id}`);
    const data = await res.json();
    setS(data.shipment);
    setStatus(data.shipment?.status || "");
    setCarrier(data.shipment?.trackingCarrier || "");
    setTracking(data.shipment?.trackingNumber || "");
    setNotes(data.shipment?.warehouseNotes || "");
  }
  useEffect(() => { load(); }, [id]);

  async function save() {
    setSaving(true); setSaved(false);
    await fetch(`/api/admin/outbound/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, trackingCarrier: carrier, trackingNumber: tracking, warehouseNotes: notes }),
    });
    setSaving(false); setSaved(true);
    load();
  }

  if (!s) return <div className="text-muted text-sm">Loading…</div>;

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-bold mb-1">{s.shipmentNumber}</h1>
      <p className="text-muted text-sm mb-6">{s.user.name} · {s.channel} · {s.tier} tier · ${s.total.toFixed(2)}</p>

      <div className="card p-6 space-y-4">
        <div>
          <label className="label mb-1 block">Status</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((st) => <option key={st} value={st}>{st.replaceAll("_", " ")}</option>)}
          </select>
          {status === "CANCELLED" && s.status !== "CANCELLED" && (
            <p className="text-xs text-accent mt-1">Cancelling will refund the customer's wallet and restock inventory.</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label mb-1 block">Carrier</label>
            <input className="input" value={carrier} onChange={(e) => setCarrier(e.target.value)} />
          </div>
          <div>
            <label className="label mb-1 block">Tracking number</label>
            <input className="input" value={tracking} onChange={(e) => setTracking(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label mb-1 block">Warehouse notes</label>
          <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button onClick={save} disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save changes"}</button>
        {saved && <p className="text-xs text-accent2">Saved. Customer notified by email.</p>}
      </div>
    </div>
  );
}
