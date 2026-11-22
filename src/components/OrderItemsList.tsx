"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";

type Item = { id: string; title: string; sku: string | null; fnsku: string | null; asin: string | null; url: string | null; quantity: number; receivedQty: number | null };

function Row({ orderId, item, editable }: { orderId: string; item: Item; editable: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: item.title, sku: item.sku ?? "", fnsku: item.fnsku ?? "", quantity: String(item.quantity) });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    const fnsku = f.fnsku.trim().toUpperCase();
    if (!f.title.trim()) return setErr(t("cart.err.name", "Enter the product name."));
    if (fnsku && !/^[A-Z0-9]{10}$/.test(fnsku)) return setErr(t("items.err.fnsku", "An FNSKU has 10 letters and digits, like X00ABC1234."));
    const quantity = parseInt(f.quantity, 10);
    if (!quantity || quantity < 1) return setErr(t("items.err.qty", "Enter a quantity of at least 1."));
    setBusy(true);
    setErr(null);
    const res = await fetch(`/api/orders/${orderId}/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: f.title.trim(), sku: f.sku.trim(), fnsku, quantity }),
    });
    setBusy(false);
    if (!res.ok) return setErr(res.status === 403 ? t("items.err.locked", "We've started labeling this order, so it can't be changed here. Send us a support message.") : t("auth.err.generic", "Something went wrong. Try again."));
    setOpen(false);
    router.refresh();
  }

  if (open)
    return (
      <li className="space-y-3 bg-paper px-4 py-4">
        <div>
          <label className="label" htmlFor={`it-n-${item.id}`}>{t("components_ordercart.product_name", "Product name")}</label>
          <input id={`it-n-${item.id}`} className="field" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor={`it-s-${item.id}`}>SKU</label>
            <input id={`it-s-${item.id}`} className="field" value={f.sku} onChange={(e) => setF({ ...f, sku: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor={`it-f-${item.id}`}>FNSKU</label>
            <input id={`it-f-${item.id}`} className="field tnum uppercase" maxLength={10} placeholder="X00…" value={f.fnsku} onChange={(e) => setF({ ...f, fnsku: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} />
          </div>
          <div>
            <label className="label" htmlFor={`it-q-${item.id}`}>{t("cart.unitsLabel", "Units")}</label>
            <input id={`it-q-${item.id}`} type="number" min={1} className="field tnum" value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} />
          </div>
        </div>
        <p className="text-[12.5px] text-ink-soft">{t("items.note", "We print one FNSKU label per unit. Charges follow the count we make on arrival.")}</p>
        {err && <p role="alert" className="rounded-md bg-fox-tint px-3 py-2 text-sm font-medium text-fox-dark">{err}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={save} disabled={busy} className="btn-fox btn-sm">{busy ? t("common.wait", "One moment…") : t("items.save", "Save")}</button>
          <button type="button" onClick={() => { setOpen(false); setErr(null); }} className="btn-ghost btn-sm">{t("items.cancel", "Cancel")}</button>
        </div>
      </li>
    );

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{item.title}</div>
        <div className="tnum text-[12.5px] text-ink-soft">{[item.sku && `SKU ${item.sku}`, item.fnsku && `FNSKU ${item.fnsku}`, item.asin && `ASIN ${item.asin}`].filter(Boolean).join(", ")}</div>
        {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="block truncate text-[12.5px] underline">{item.url}</a>}
      </div>
      <div className="tnum text-end text-sm">
        <div className="font-semibold">{t("order.expected", "{n} expected", { n: item.quantity.toLocaleString() })}</div>
        {item.receivedQty != null && <div className={item.receivedQty === item.quantity ? "text-ok" : "text-fox-dark"}>{t("order.received", "{n} received", { n: item.receivedQty.toLocaleString() })}</div>}
      </div>
      {editable && (
        <button type="button" onClick={() => setOpen(true)} className="text-[13px] font-semibold text-ink underline-offset-2 hover:underline">
          {t("items.edit", "Edit")}
        </button>
      )}
    </li>
  );
}

export function OrderItemsList({ orderId, items, editable }: { orderId: string; items: Item[]; editable: boolean }) {
  return (
    <ul className="panel divide-y divide-line">
      {items.map((i) => <Row key={i.id} orderId={orderId} item={i} editable={editable} />)}
    </ul>
  );
}
