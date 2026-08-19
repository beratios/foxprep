"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { WAREHOUSE_ADDRESS } from "@/lib/config";

export default function InboundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [shipment, setShipment] = useState<any>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const [polybagQty, setPolybagQty] = useState(0);
  const [bundleQty, setBundleQty] = useState(0);
  const [insertQty, setInsertQty] = useState(0);
  const [quote, setQuote] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch(`/api/inbound/${id}`);
    const data = await res.json();
    setShipment(data.shipment);
  }
  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    fetch("/api/wallet").then((r) => r.json()).then((d) => setBalance(d.balance ?? 0));
  }, []);

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

  async function pay() {
    setPaying(true);
    setError("");
    const res = await fetch(`/api/inbound/${id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ polybagQty, bundleQty, insertQty }),
    });
    const data = await res.json();
    setPaying(false);
    if (!res.ok) { setError(data.error); return; }
    load();
  }

  if (!shipment) return <div className="text-muted text-sm">Loading…</div>;

  const insufficientFunds = quote && balance !== null && balance < quote.total;

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-2xl font-bold">{shipment.shipmentNumber}</h1>
        <span className="text-xs px-3 py-1 rounded-full border border-border">{shipment.status}</span>
      </div>
      <p className="text-muted text-sm mb-6">{new Date(shipment.createdAt).toLocaleString()}</p>

      <div className="card divide-y divide-border mb-5">
        {shipment.items.map((it: any) => (
          <div key={it.id} className="flex items-center justify-between p-4 text-sm">
            <div>
              <div className="font-semibold">{it.product.title}</div>
              <div className="text-xs text-muted">SKU: {it.product.sku}</div>
            </div>
            <div className="text-right">
              <div>Expected: {it.expectedQty}</div>
              {it.receivedQty !== null && (
                <div className={it.receivedQty === it.expectedQty ? "text-green-400" : "text-red-400"}>
                  Received: {it.receivedQty}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {shipment.status === "EXPECTED" && (
        <div className="card p-5 text-sm">
          <div className="label mb-2">SEND YOUR STOCK TO</div>
          <div className="font-semibold">{WAREHOUSE_ADDRESS.line1}</div>
          <div>{WAREHOUSE_ADDRESS.line2}</div>
          <div>{WAREHOUSE_ADDRESS.line3}</div>
          <div className="text-accent font-semibold mt-2">Ref: {shipment.shipmentNumber}</div>
          <p className="text-xs text-muted mt-2">
            Give this address to your supplier or manufacturer. Include the reference number on the shipping
            label so our team matches it to your account when it arrives.
          </p>
        </div>
      )}

      {readyToPay && (
        <div className="card p-5">
          {shipment.status === "DISCREPANCY" && (
            <p className="text-red-400 text-xs mb-4">
              Heads up: what we counted didn't match what was expected. You can still pay for what actually
              arrived below — reach out on WhatsApp if something looks wrong.
            </p>
          )}
          <div className="label mb-2">WE'VE RECEIVED {receivedUnits} UNITS — CHOOSE PREP SERVICES</div>
          <p className="text-xs text-muted mb-4">
            Labeling is included in the per-unit rate. Pick any add-ons below, then pay before we start prep work.
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
              <Row label="HST (13%)" val={`$${quote.tax.toFixed(2)}`} />
              <div className="pt-2">
                <div className="font-display text-2xl font-bold text-accent">${quote.total.toFixed(2)} CAD</div>
                {balance !== null && (
                  <div className="text-xs text-muted mt-1">
                    Wallet: ${balance.toFixed(2)} {insufficientFunds && <span className="text-red-400">— insufficient, top up first</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

          {insufficientFunds ? (
            <Link href="/dashboard/wallet" className="btn-primary block text-center mt-4">Top up wallet →</Link>
          ) : (
            <button onClick={pay} disabled={paying} className="btn-primary w-full mt-4">
              {paying ? "Processing payment…" : "Pay & start prep"}
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
            <span>Total paid</span><span>${shipment.total.toFixed(2)}</span>
          </div>
          <p className="text-xs text-muted mt-3">
            This stock is now in your inventory and ready to ship — no further charge when you send it out.
          </p>
          <Link href="/dashboard/inventory" className="text-xs text-accent2 mt-2 inline-block">View inventory →</Link>
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
