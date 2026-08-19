"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Customer = { id: string; name: string; email: string };
type InvItem = { id: string; quantity: number; userId: string; product: { id: string; sku: string; title: string } };
type Line = { productId: string; title: string; quantity: number };

export default function AdminNewOutboundPage() {
  return (
    <Suspense fallback={null}>
      <AdminNewOutboundForm />
    </Suspense>
  );
}

function AdminNewOutboundForm() {
  const router = useRouter();
  const params = useSearchParams();
  const preselectedUserId = params.get("userId") || "";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [userId, setUserId] = useState(preselectedUserId);
  const [inventory, setInventory] = useState<InvItem[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [selected, setSelected] = useState("");
  const [selectedQty, setSelectedQty] = useState(1);
  const [channel, setChannel] = useState<"AMAZON" | "MANUAL">("AMAZON");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/customers").then((r) => r.json()).then((d) => setCustomers(d.customers ?? []));
  }, []);

  useEffect(() => {
    if (!userId) { setInventory([]); return; }
    fetch(`/api/admin/inventory?userId=${userId}`).then((r) => r.json()).then((d) => setInventory(d.items ?? []));
    setLines([]);
  }, [userId]);

  function addLine() {
    const inv = inventory.find((i) => i.product.id === selected);
    if (!inv) return;
    const already = lines.find((l) => l.productId === inv.product.id)?.quantity ?? 0;
    if (selectedQty + already > inv.quantity) { setError("Quantity exceeds what's available in inventory."); return; }
    setError("");
    if (lines.find((l) => l.productId === inv.product.id)) {
      setLines(lines.map((l) => l.productId === inv.product.id ? { ...l, quantity: l.quantity + selectedQty } : l));
    } else {
      setLines([...lines, { productId: inv.product.id, title: inv.product.title, quantity: selectedQty }]);
    }
    setSelected(""); setSelectedQty(1);
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/admin/outbound", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, channel, items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })) }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(data.error); return; }
    router.push(`/admin/outbound/${data.shipment.id}`);
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-bold mb-2">Create outbound shipment</h1>
      <p className="text-muted text-sm mb-6">Not billed — this stock was already paid for as a prep fee when it was received.</p>

      <div className="card p-5 mb-4 space-y-4">
        <div>
          <label className="label mb-2 block">Customer</label>
          <select className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Select a customer…</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
          </select>
        </div>

        {userId && (
          <>
            <div>
              <label className="label mb-2 block">Ship to</label>
              <div className="flex gap-2">
                <button onClick={() => setChannel("AMAZON")} className={`toggle-btn ${channel === "AMAZON" ? "active" : ""}`} style={{ flex: 1 }}>Amazon FBA</button>
                <button onClick={() => setChannel("MANUAL")} className={`toggle-btn ${channel === "MANUAL" ? "active" : ""}`} style={{ flex: 1 }}>FBM / customer direct</button>
              </div>
            </div>

            {inventory.length === 0 ? (
              <p className="text-sm text-muted">This customer has no inventory available to ship.</p>
            ) : (
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
            )}

            {lines.length > 0 && (
              <div className="divide-y divide-border border border-border rounded-lg">
                {lines.map((l) => (
                  <div key={l.productId} className="flex justify-between p-3 text-sm">
                    <span>{l.title}</span><span className="text-muted">{l.quantity} units</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      <button onClick={submit} disabled={submitting || lines.length === 0 || !userId} className="btn-primary w-full">
        {submitting ? "Creating…" : "Create shipment"}
      </button>
    </div>
  );
}
