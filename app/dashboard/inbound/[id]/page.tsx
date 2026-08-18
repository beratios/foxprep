"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { WAREHOUSE_ADDRESS } from "@/lib/config";

export default function InboundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [shipment, setShipment] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/inbound/${id}`).then((r) => r.json()).then((d) => setShipment(d.shipment));
  }, [id]);

  if (!shipment) return <div className="text-muted text-sm">Loading…</div>;

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

      {shipment.status === "DISCREPANCY" && (
        <div className="card p-5 text-sm border-red-500/40">
          <div className="text-red-400 font-semibold mb-1">Quantities didn't match</div>
          <p className="text-muted text-xs">
            What we counted on arrival differs from what was expected. If this needs a closer look, open a
            support ticket or message us on WhatsApp.
          </p>
        </div>
      )}
    </div>
  );
}
