"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type InvItem = { id: string; quantity: number; product: { id: string; sku: string; title: string; photoUrl: string | null } };
type Line = { productId: string; title: string; available: number; quantity: number };

export default function NewOutboundPage() {
  const router = useRouter();
  const [inventory, setInventory] = useState<InvItem[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [selected, setSelected] = useState("");
  const [selectedQty, setSelectedQty] = useState(1);
  const [channel, setChannel] = useState<"AMAZON" | "MANUAL">("AMAZON");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/inventory").then((r) => r.json()).then((d) => setInventory(d.items ?? []));
  }, []);

  const totalUnits = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines]);

  function addLine() {
    const inv = inventory.find((i) => i.product.id === selected);
    if (!inv) return;
    const already = lines.find((l) => l.productId === inv.product.id)?.quantity ?? 0;
    if (selectedQty + already > inv.quantity) {
      setError("Quantity exceeds what's available in inventory.");
      return;
    }
    setError("");
    const existing = lines.find((l) => l.productId === inv.product.id);
    if (existing) {
      setLines(lines.map((l) => l.productId === inv.product.id ? { ...l, quantity: l.quantity + selectedQty } : l));
    } else {
      setLines([...lines, { productId: inv.product.id, title: inv.product.title, available: inv.quantity, quantity: selectedQty }]);
    }
    setSelected(""); setSelectedQty(1);
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/outbound", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })) }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(data.error); return; }
    router.push(`/dashboard/outbound/${data.shipment.id}`);
  }

  if (inventory.length === 0) {
    return (
      <div className="max-w-lg">
        <h1 className="font-display text-2xl font-bold mb-3">New outbound shipment</h1>
        <p className="text-muted text-sm">
          Nothing in inventory yet. <Link href="/dashboard/inbound/new" className="text-accent2">Send stock in</Link> first,
          then pay the prep fee once it's received, and it'll show up here ready to ship.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-bold mb-2">New outbound shipment</h1>
      <p className="text-muted text-sm mb-6">
        This stock was already paid for when it was received — this step just sends it on its way.
      </p>

      <div className="card p-5 mb-4 space-y-4">
        <div>
          <label className="label mb-2 block">Ship to</label>
          <div className="flex gap-2">
            <button onClick={() => setChannel("AMAZON")} className={`toggle-btn ${channel === "AMAZON" ? "active" : ""}`} style={{ flex: 1 }}>Amazon FBA</button>
            <button onClick={() => setChannel("MANUAL")} className={`toggle-btn ${channel === "MANUAL" ? "active" : ""}`} style={{ flex: 1 }}>FBM / customer direct</button>
          </div>
        </div>

        <div>
          <label className="label mb-2 block">Add product</label>
          <div className="flex gap-2">
            <select className="input" value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">Select…</option>
              {inventory.map((i) => <option key={i.id} value={i.product.id}>{i.product.title} ({i.quantity} available)</option>)}
            </select>
            <input type="number" min={1} className="input" style={{ width: 90 }} value={selectedQty} onChange={(e) => setSelectedQty(Math.max(1, +e.target.value))} />
            <button onClick={addLine} disabled={!selected} className="btn-secondary whitespace-nowrap">Add</button>
          </div>
        </div>

        {lines.length > 0 && (
          <div className="divide-y divide-border border border-border rounded-lg">
            {lines.map((l) => (
              <div key={l.productId} className="flex justify-between p-3 text-sm">
                <span>{l.title}</span>
                <span className="text-muted">{l.quantity} units</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      <button onClick={submit} disabled={submitting || lines.length === 0} className="btn-primary w-full">
        {submitting ? "Creating…" : `Ship ${totalUnits > 0 ? totalUnits + " units" : ""}`}
      </button>
    </div>
  );
}
