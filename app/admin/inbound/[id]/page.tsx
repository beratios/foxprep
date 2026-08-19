"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function AdminInboundDetail() {
  const { id } = useParams<{ id: string }>();
  const [shipment, setShipment] = useState<any>(null);
  const [received, setReceived] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string>("");

  const [polybagQty, setPolybagQty] = useState(0);
  const [bundleQty, setBundleQty] = useState(0);
  const [insertQty, setInsertQty] = useState(0);
  const [quote, setQuote] = useState<any>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  async function load() {
    const res = await fetch(`/api/inbound/${id}`);
    const data = await res.json();
    setShipment(data.shipment);
    const init: Record<string, number> = {};
    data.shipment?.items.forEach((it: any) => { init[it.id] = it.receivedQty ?? it.expectedQty; });
    setReceived(init);
    if (data.shipment?.userId) {
      fetch(`/api/admin/customers`).then((r) => r.json()).then((d) => {
        const c = (d.customers ?? []).find((c: any) => c.id === data.shipment.userId);
        setBalance(c?.balance ?? 0);
      });
    }
  }
  useEffect(() => { load(); }, [id]);

  const receivedUnits = useMemo(
    () => shipment?.items.reduce((s: number, it: any) => s + (it.receivedQty ?? 0), 0) ?? 0,
    [shipment]
  );
  const readyToPay = shipment && (shipment.status === "RECEIVED" || shipment.status === "DISCREPANCY") && !shipment.paidAt;

  useEffect(() => {
    if (!readyToPay) return;
    fetch(`/api/inbound/${id}/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ polybagQty, bundleQty, insertQty }),
    }).then((r) => r.json()).then((d) => setQuote(d.quote));
  }, [readyToPay, polybagQty, bundleQty, insertQty, id]);

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

  async function chargePrepFee() {
    setPaying(true);
    setPayError("");
    const res = await fetch(`/api/inbound/${id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ polybagQty, bundleQty, insertQty }),
    });
    const data = await res.json();
    setPaying(false);
    if (!res.ok) { setPayError(data.error); return; }
    load();
  }

  if (!shipment) return <div className="text-muted text-sm">Loading…</div>;
  const insufficientFunds = quote && balance !== null && balance < quote.total;

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-bold mb-1">{shipment.shipmentNumber}</h1>
      <p className="text-muted text-sm mb-6">{shipment.user.name} · {shipment.user.email}</p>

      <div className="card p-5 space-y-4 mb-5">
        {shipment.items.map((it: any) => (
          <div key={it.id} className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-sm">{it.product.title}</div>
              <div className="text-xs text-muted">Expected: {it.expectedQty}</div>
            </div>
            <input
              type="number" min={0} className="input" style={{ width: 90 }}
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
          <p className="text-xs text-accent2">Received: {receivedUnits} units total</p>
        )}
        {result && <p className="text-xs text-muted">{result}</p>}
      </div>

      {readyToPay && (
        <div className="card p-5">
          <div className="label mb-2">CHARGE CUSTOMER FOR PREP</div>
          <p className="text-xs text-muted mb-4">
            Select add-ons and charge the customer's wallet before prep work starts. Labeling is included in
            the per-unit rate.
          </p>
          <div className="grid grid-cols-[1fr,80px] gap-2 items-center text-sm mb-4">
            <span>Poly-bagging</span>
            <input type="number" min={0} className="input" value={polybagQty} onChange={(e) => setPolybagQty(Math.max(0, +e.target.value))} />
            <span>Bundling</span>
            <input type="number" min={0} className="input" value={bundleQty} onChange={(e) => setBundleQty(Math.max(0, +e.target.value))} />
            <span>Custom insert</span>
            <input type="number" min={0} className="input" value={insertQty} onChange={(e) => setInsertQty(Math.max(0, +e.target.value))} />
          </div>

          {quote && (
            <div className="border-t border-border pt-4 text-sm space-y-2">
              <Row label={`${receivedUnits} units × $${quote.rate.toFixed(2)} (${quote.tier})`} val={`$${quote.base.toFixed(2)}`} />
              {quote.poly > 0 && <Row label="Poly-bagging" val={`$${quote.poly.toFixed(2)}`} />}
              {quote.bundle > 0 && <Row label="Bundling" val={`$${quote.bundle.toFixed(2)}`} />}
              {quote.insert > 0 && <Row label="Inserts" val={`$${quote.insert.toFixed(2)}`} />}
              <Row label="Subtotal" val={`$${quote.subtotal.toFixed(2)}`} bold />
              <Row label="HST" val={`$${quote.tax.toFixed(2)}`} />
              <div className="pt-2">
                <div className="font-display text-2xl font-bold text-accent">${quote.total.toFixed(2)} CAD</div>
                {balance !== null && (
                  <div className="text-xs text-muted mt-1">
                    Customer wallet: ${balance.toFixed(2)} {insufficientFunds && <span className="text-red-400">— insufficient</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {payError && <p className="text-red-400 text-xs mt-3">{payError}</p>}

          {insufficientFunds ? (
            <p className="text-xs text-red-400 mt-4">Customer needs to top up their wallet before this can be charged.</p>
          ) : (
            <button onClick={chargePrepFee} disabled={paying} className="btn-primary w-full mt-4">
              {paying ? "Charging…" : "Charge prep fee"}
            </button>
          )}
        </div>
      )}

      {shipment.paidAt && (
        <div className="card p-5 text-sm">
          <div className="label mb-2">PREP FEE — PAID</div>
          <Row label={`${receivedUnits} units × $${shipment.rateApplied.toFixed(2)} (${shipment.tier})`} val={`$${shipment.subtotal.toFixed(2)}`} bold />
          <Row label="HST" val={`$${shipment.tax.toFixed(2)}`} />
          <div className="border-t border-border mt-2 pt-2 flex justify-between font-semibold">
            <span>Total charged</span><span>${shipment.total.toFixed(2)}</span>
          </div>
          <Link href="/admin/outbound/new" className="text-xs text-accent2 mt-3 inline-block">Create outbound shipment →</Link>
        </div>
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
