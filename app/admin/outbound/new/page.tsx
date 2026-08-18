"use client";
import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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
  const [polybagQty, setPolybagQty] = useState(0);
  const [bundleQty, setBundleQty] = useState(0);
  const [insertQty, setInsertQty] = useState(0);
  const [quote, setQuote] = useState<any>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/customers").then((r) => r.json()).then((d) => setCustomers(d.customers ?? []));
  }, []);

  useEffect(() => {
    if (!userId) { setInventory([]); setBalance(null); return; }
    fetch(`/api/admin/inventory?userId=${userId}`).then((r) => r.json()).then((d) => setInventory(d.items ?? []));
    const c = customers.find((c) => c.id === userId) as any;
    setBalance(c?.balance ?? null);
    fetch("/api/admin/customers").then((r) => r.json()).then((d) => {
      const found = (d.customers ?? []).find((c: any) => c.id === userId);
      setBalance(found?.balance ?? 0);
    });
    setLines([]);
  }, [userId]);

  const totalUnits = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines]);

  useEffect(() => {
    if (totalUnits === 0 || !userId) { setQuote(null); return; }
    fetch("/api/outbound/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ units: totalUnits, polybagQty, bundleQty, insertQty, targetUserId: userId }),
    }).then((r) => r.json()).then((d) => setQuote(d.quote));
  }, [totalUnits, polybagQty, bundleQty, insertQty, userId]);

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
      body: JSON.stringify({
        userId, channel,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        polybagQty, bundleQty, insertQty,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(data.error); return; }
    router.push(`/admin/outbound/${data.shipment.id}`);
  }

  const insufficientFunds = quote && balance !== null && balance < quote.total;

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-bold mb-6">Create outbound shipment</h1>

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

            <div>
              <div className="label mb-2">ADD-ON SERVICES</div>
              <div className="grid grid-cols-[1fr,80px] gap-2 items-center text-sm">
                <span>Poly-bagging</span>
                <input type="number" min={0} className="input" value={polybagQty} onChange={(e) => setPolybagQty(Math.max(0, +e.target.value))} />
                <span>Bundling</span>
                <input type="number" min={0} className="input" value={bundleQty} onChange={(e) => setBundleQty(Math.max(0, +e.target.value))} />
                <span>Custom insert</span>
                <input type="number" min={0} className="input" value={insertQty} onChange={(e) => setInsertQty(Math.max(0, +e.target.value))} />
              </div>
            </div>
          </>
        )}
      </div>

      {quote && (
        <div className="card p-5 mb-4 text-sm space-y-2">
          <div className="label mb-1">{quote.tier.toUpperCase()} TIER — ${quote.rate.toFixed(2)}/unit</div>
          <Row label="Prep" val={`$${quote.base.toFixed(2)}`} />
          {quote.poly > 0 && <Row label="Poly-bagging" val={`$${quote.poly.toFixed(2)}`} />}
          {quote.bundle > 0 && <Row label="Bundling" val={`$${quote.bundle.toFixed(2)}`} />}
          {quote.insert > 0 && <Row label="Inserts" val={`$${quote.insert.toFixed(2)}`} />}
          <Row label="Subtotal" val={`$${quote.subtotal.toFixed(2)}`} bold />
          <Row label="HST (13%)" val={`$${quote.tax.toFixed(2)}`} />
          <div className="border-t border-border pt-3 mt-1">
            <div className="font-display text-2xl font-bold text-accent">${quote.total.toFixed(2)} CAD</div>
            {balance !== null && (
              <div className="text-xs text-muted mt-1">
                Customer wallet: ${balance.toFixed(2)} {insufficientFunds && <span className="text-red-400">— insufficient</span>}
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      {insufficientFunds ? (
        <p className="text-xs text-red-400">This customer needs to top up their wallet before this shipment can be created.</p>
      ) : (
        <button onClick={submit} disabled={submitting || lines.length === 0 || !userId} className="btn-primary w-full">
          {submitting ? "Creating…" : "Charge wallet & create shipment"}
        </button>
      )}
    </div>
  );
}

function Row({ label, val, bold }: { label: string; val: string; bold?: boolean }) {
  return <div className={`flex justify-between ${bold ? "font-semibold" : "text-[#c7cbd1]"}`}><span>{label}</span><span>{val}</span></div>;
}
