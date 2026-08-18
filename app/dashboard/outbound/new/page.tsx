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
  const [polybagQty, setPolybagQty] = useState(0);
  const [bundleQty, setBundleQty] = useState(0);
  const [insertQty, setInsertQty] = useState(0);

  const [quote, setQuote] = useState<any>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/inventory").then((r) => r.json()).then((d) => setInventory(d.items ?? []));
    fetch("/api/wallet").then((r) => r.json()).then((d) => setBalance(d.balance ?? 0));
  }, []);

  const totalUnits = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines]);

  useEffect(() => {
    if (totalUnits === 0) { setQuote(null); return; }
    fetch("/api/outbound/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ units: totalUnits, polybagQty, bundleQty, insertQty }),
    }).then((r) => r.json()).then((d) => setQuote(d.quote));
  }, [totalUnits, polybagQty, bundleQty, insertQty]);

  function addLine() {
    const inv = inventory.find((i) => i.product.id === selected);
    if (!inv) return;
    if (selectedQty > inv.quantity - (lines.find((l) => l.productId === inv.product.id)?.quantity ?? 0)) {
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
      body: JSON.stringify({
        channel,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        polybagQty, bundleQty, insertQty,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(data.error); return; }
    router.push(`/dashboard/outbound/${data.shipment.id}`);
  }

  const insufficientFunds = quote && balance !== null && balance < quote.total;

  if (inventory.length === 0) {
    return (
      <div className="max-w-lg">
        <h1 className="font-display text-2xl font-bold mb-3">New outbound shipment</h1>
        <p className="text-muted text-sm">
          Nothing in inventory yet. <Link href="/dashboard/inbound/new" className="text-accent2">Send stock in</Link> first,
          then come back here once it's received.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-bold mb-6">New outbound shipment</h1>

      <div className="card p-5 mb-4 space-y-4">
        <div>
          <label className="label mb-2 block">Ship to</label>
          <div className="model-toggle flex gap-2">
            <button onClick={() => setChannel("AMAZON")} className={`toggle-btn ${channel === "AMAZON" ? "active" : ""}`} style={{ flex: 1 }}>
              Amazon FBA
            </button>
            <button onClick={() => setChannel("MANUAL")} className={`toggle-btn ${channel === "MANUAL" ? "active" : ""}`} style={{ flex: 1 }}>
              FBM / customer direct
            </button>
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
                Wallet: ${balance.toFixed(2)} {insufficientFunds && <span className="text-red-400">— insufficient, top up first</span>}
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      {insufficientFunds ? (
        <Link href="/dashboard/wallet" className="btn-primary block text-center">Top up wallet →</Link>
      ) : (
        <button onClick={submit} disabled={submitting || lines.length === 0} className="btn-primary w-full">
          {submitting ? "Placing shipment…" : "Pay & confirm shipment"}
        </button>
      )}
    </div>
  );
}

function Row({ label, val, bold }: { label: string; val: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : "text-[#c7cbd1]"}`}>
      <span>{label}</span><span>{val}</span>
    </div>
  );
}
