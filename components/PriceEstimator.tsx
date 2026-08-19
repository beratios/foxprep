"use client";
import { useEffect, useMemo, useState } from "react";
import { quotePrepWork, DEFAULT_RATES, type PricingRates } from "@/lib/pricing";

// Live "what would this cost me" simulator — same math the real payment
// step uses, but read-only and with no rolling-volume lookup (shows the
// price at whatever tier the entered quantity alone would fall into, as a
// simple estimate; the real charge at payment time also factors in your
// last 30 days of received stock, so the actual number may land in a
// cheaper tier if you've already received volume this month).
export default function PriceEstimator() {
  const [rates, setRates] = useState<PricingRates>(DEFAULT_RATES);
  const [units, setUnits] = useState(300);
  const [polybagQty, setPolybagQty] = useState(0);
  const [bundleQty, setBundleQty] = useState(0);
  const [insertQty, setInsertQty] = useState(0);

  useEffect(() => {
    fetch("/api/pricing").then((r) => r.json()).then((d) => d.rates && setRates(d.rates));
  }, []);

  const quote = useMemo(
    () => quotePrepWork(units, 0, { polybagQty, bundleQty, insertQty }, rates),
    [units, polybagQty, bundleQty, insertQty, rates]
  );

  const fmt = (n: number) => n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 2 });

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-lg font-bold">Price estimator</h2>
        <span className="text-[10px] px-2 py-1 rounded-full border border-border text-muted">Simulation</span>
      </div>
      <p className="text-xs text-muted mb-5">
        See roughly what an inbound shipment would cost. Payment happens for real once we've received your
        stock — go to that shipment's page and pay there before we start prep.
      </p>

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className="label mb-2 block">Units in this shipment</label>
          <div className="flex items-center gap-3 mb-2">
            <input type="number" min={1} className="input" style={{ width: 100 }} value={units} onChange={(e) => setUnits(Math.max(1, +e.target.value))} />
            <span className="text-xs text-muted">units</span>
          </div>
          <input type="range" min={1} max={10000} value={units} onChange={(e) => setUnits(+e.target.value)} className="w-full" />

          <div className="label mt-5 mb-2">ADD-ON SERVICES</div>
          <div className="grid grid-cols-[1fr,80px] gap-2 items-center text-sm">
            <span>Poly-bagging <span className="text-muted">({fmt(rates.polyRate)})</span></span>
            <input type="number" min={0} className="input" value={polybagQty} onChange={(e) => setPolybagQty(Math.max(0, +e.target.value))} />
            <span>Bundling <span className="text-muted">({fmt(rates.bundleRate)})</span></span>
            <input type="number" min={0} className="input" value={bundleQty} onChange={(e) => setBundleQty(Math.max(0, +e.target.value))} />
            <span>Custom insert <span className="text-muted">({fmt(rates.insertRate)})</span></span>
            <input type="number" min={0} className="input" value={insertQty} onChange={(e) => setInsertQty(Math.max(0, +e.target.value))} />
          </div>
        </div>

        <div className="border-t sm:border-t-0 sm:border-l border-border pt-5 sm:pt-0 sm:pl-6">
          <div className="label mb-2">{quote.tier.toUpperCase()} TIER — {fmt(quote.rate)}/unit</div>
          <div className="space-y-1.5 text-sm text-[#c7cbd1] mb-3">
            <Row label={`${units} units × ${fmt(quote.rate)}`} val={fmt(quote.base)} />
            {quote.poly > 0 && <Row label="Poly-bagging" val={fmt(quote.poly)} />}
            {quote.bundle > 0 && <Row label="Bundling" val={fmt(quote.bundle)} />}
            {quote.insert > 0 && <Row label="Inserts" val={fmt(quote.insert)} />}
            <Row label="Subtotal" val={fmt(quote.subtotal)} bold />
            <Row label="HST (13%)" val={fmt(quote.tax)} />
          </div>
          <div className="border-t border-border pt-3">
            <div className="label mb-1">ESTIMATED TOTAL</div>
            <div className="font-display text-3xl font-bold text-accent">{fmt(quote.total)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, val, bold }: { label: string; val: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-[#eef0f2]" : ""}`}>
      <span>{label}</span><span>{val}</span>
    </div>
  );
}
