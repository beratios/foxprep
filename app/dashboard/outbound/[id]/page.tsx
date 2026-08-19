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
          #shipment-doc, #shipment-doc * { visibility: visible; }
          #shipment-doc { position: absolute; top: 0; left: 0; width: 100%; color: #000; background: #fff; padding: 24px; }
        }
      `}</style>

      <div className="flex items-center justify-between mb-1 print:hidden">
        <h1 className="font-display text-2xl font-bold">{s.shipmentNumber}</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="text-xs text-accent2">Print packing slip</button>
          <span className="text-xs px-3 py-1 rounded-full border border-border">{s.status.replaceAll("_", " ")}</span>
        </div>
      </div>
      <p className="text-muted text-sm mb-6 print:hidden">{new Date(s.createdAt).toLocaleString()} · {s.channel}</p>

      <div id="shipment-doc">
        <div className="mb-4">
          <div className="font-display font-bold text-lg">{COMPANY_NAME}</div>
          <div className="text-xs text-muted">Outbound shipment — {s.shipmentNumber}</div>
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

        <div className="card p-5 text-sm text-muted">
          No charge for this shipment — prep was already paid when this stock was received. See your{" "}
          <a href="/dashboard/inbound" className="text-accent2 print:hidden">inbound shipments</a> for that receipt.
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
