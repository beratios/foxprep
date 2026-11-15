"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/generated/prisma/client";
import { STATUS } from "@/lib/status";

export function AdminOrderForm({
  order,
  items,
}: {
  order: { id: string; status: OrderStatus; outboundTracking: string; adminNotes: string };
  items: { id: string; title: string; sku: string | null; quantity: number; receivedQty: number | null }[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState("");
  const [outboundTracking, setOut] = useState(order.outboundTracking);
  const [adminNotes, setAdminNotes] = useState(order.adminNotes);
  const [received, setReceived] = useState<Record<string, string>>(Object.fromEntries(items.map((i) => [i.id, i.receivedQty?.toString() ?? ""])));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <form
      className="panel space-y-4 p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        const res = await fetch(`/api/admin/orders/${order.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            note,
            outboundTracking,
            adminNotes,
            received: Object.fromEntries(Object.entries(received).filter(([, v]) => v !== "").map(([k, v]) => [k, parseInt(v, 10)])),
          }),
        });
        const json = await res.json().catch(() => ({}));
        setBusy(false);
        setMsg(res.ok ? "Saved" : json.error || "Couldn't save");
        if (res.ok) {
          setNote("");
          router.refresh();
        }
      }}
    >
      <h2 className="text-lg font-bold">Update order</h2>
      <div>
        <label className="label" htmlFor="st">Status</label>
        <select id="st" className="field" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
          {(Object.keys(STATUS) as OrderStatus[]).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="nt">Note for the customer</label>
        <input id="nt" className="field" placeholder="e.g. 12 of 12 cartons received, 2 crushed" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      {items.length > 0 && (
        <fieldset>
          <legend className="label">Received counts</legend>
          <ul className="space-y-2">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate">{i.title} <span className="text-ink-soft">({i.quantity})</span></span>
                <input aria-label={`Received ${i.title}`} className="field tnum w-24 py-1.5" inputMode="numeric" value={received[i.id]} onChange={(e) => setReceived({ ...received, [i.id]: e.target.value.replace(/\D/g, "") })} />
              </li>
            ))}
          </ul>
        </fieldset>
      )}
      <div>
        <label className="label" htmlFor="ot">Outbound tracking / Amazon shipment ID</label>
        <input id="ot" className="field" value={outboundTracking} onChange={(e) => setOut(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="an">Internal notes</label>
        <textarea id="an" rows={3} className="field" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
      </div>
      <button className="btn-fox w-full" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
      {msg && <p role="status" className="text-center text-sm font-semibold">{msg}</p>}
    </form>
  );
}
