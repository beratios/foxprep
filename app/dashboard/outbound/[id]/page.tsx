"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { COMPANY_NAME } from "@/lib/config";

export default function OutboundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [s, setS] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/outbound/${id}`).then((r) => r.json()).then((d) => setS(d.shipment));
  }, [id]);

  if (!s) return <div className="text-muted text-sm">Loading…</div>;

  return (
    <div className="max-w-lg">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice, #invoice * { visibility: visible; }
          #invoice { position: absolute; top: 0; left: 0; width: 100%; color: #000; background: #fff; padding: 24px; }
        }
      `}</style>

      <div className="flex items-center justify-between mb-1 print:hidden">
        <h1 className="font-display text-2xl font-bold">{s.shipmentNumber}</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="text-xs text-accent2">Print invoice</button>
          <span className="text-xs px-3 py-1 rounded-full border border-border">{s.status.replaceAll("_", " ")}</span>
        </div>
      </div>
      <p className="text-muted text-sm mb-6 print:hidden">{new Date(s.createdAt).toLocaleString()}</p>

      <div id="invoice">
        <div className="mb-4">
          <div className="font-display font-bold text-lg">{COMPANY_NAME}</div>
          <div className="text-xs text-muted">Invoice — {s.shipmentNumber}</div>
          <div className="text-xs text-muted">{new Date(s.createdAt).toLocaleString()}</div>
        </div>

        <div className="card divide-y divide-border mb-5">
          {s.items.map((it: any) => (
            <div key={it.id} className="flex justify-between p-4 text-sm">
              <div>
                <div className="font-semibold">{it.product.title}</div>
                <div className="text-xs text-muted">SKU: {it.product.sku}</div>
              </div>
              <div>{it.quantity} units</div>
            </div>
          ))}
        </div>

        <div className="card p-5 text-sm space-y-2">
          <div className="label mb-1">{s.tier.toUpperCase()} TIER — ${s.rateApplied.toFixed(2)}/unit</div>
          {s.polybagQty > 0 && <Row label={`${s.polybagQty} × poly-bagging`} val="" />}
          {s.bundleQty > 0 && <Row label={`${s.bundleQty} × bundling`} val="" />}
          {s.insertQty > 0 && <Row label={`${s.insertQty} × custom insert`} val="" />}
          <Row label="Subtotal" val={`$${s.subtotal.toFixed(2)}`} bold />
          <Row label="HST (13%)" val={`$${s.tax.toFixed(2)}`} />
          <div className="border-t border-border pt-3 mt-1 flex justify-between items-center">
            <span className="font-display font-bold text-lg">Total</span>
            <span className="font-display font-bold text-xl text-accent">${s.total.toFixed(2)} CAD</span>
          </div>
        </div>

        {s.trackingNumber && (
          <div className="card p-5 mt-4 text-sm">
            <div className="label mb-2">TRACKING</div>
            <div>{s.trackingCarrier} — {s.trackingNumber}</div>
          </div>
        )}
      </div>
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
