"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import JsBarcode from "jsbarcode";

type Item = { id: string; title: string; sku: string; fnsku: string; quantity: number; receivedQty: number | null };

/** Label stock we support. Thermal sizes print one label per page; Letter prints Avery 5160-style 30-up sheets. */
const SIZES = {
  t225: { name: 'Thermal 2.25" × 1.25"', w: 2.25, h: 1.25, sheet: false },
  t2: { name: 'Thermal 2" × 1"', w: 2, h: 1, sheet: false },
  l30: { name: 'Letter sheet, 30 labels (2.625" × 1")', w: 2.625, h: 1, sheet: true },
} as const;
type SizeKey = keyof typeof SIZES;

const FNSKU_RE = /^[A-Z0-9]{10}$/;

function BarcodeSvg({ value, height }: { value: string; height: number }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    try {
      JsBarcode(ref.current, value, { format: "CODE128", displayValue: false, margin: 0, height, width: 2 });
    } catch {
      /* invalid value: leave empty */
    }
  }, [value, height]);
  return <svg ref={ref} className="fp-bc" />;
}

function Label({ item, cond }: { item: Item; cond: string }) {
  return (
    <div className="fp-label">
      <BarcodeSvg value={item.fnsku} height={60} />
      <div className="fp-code">{item.fnsku}</div>
      <div className="fp-title">{item.title}</div>
      <div className="fp-cond">{cond}</div>
    </div>
  );
}

export function LabelPrinter({ orderId, orderRef, items: initial }: { orderId: string; orderRef: string; items: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [counts, setCounts] = useState<Record<string, number>>(Object.fromEntries(initial.map((i) => [i.id, i.quantity])));
  const [size, setSize] = useState<SizeKey>("t225");
  const [cond, setCond] = useState("New");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const s = SIZES[size];
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dirty = items.filter((i) => {
    const o = initial.find((x) => x.id === i.id)!;
    return o.title !== i.title || o.fnsku !== i.fnsku || o.quantity !== i.quantity;
  });
  const bad = items.filter((i) => (counts[i.id] ?? 0) > 0 && !FNSKU_RE.test(i.fnsku));
  const labels = useMemo(
    () => items.flatMap((i) => (FNSKU_RE.test(i.fnsku) ? Array.from({ length: Math.max(0, counts[i.id] ?? 0) }, () => i) : [])),
    [items, counts],
  );

  const set = (id: string, patch: Partial<Item>) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  async function save() {
    setBusy(true);
    setMsg(null);
    for (const i of dirty) {
      const res = await fetch(`/api/orders/${orderId}/items/${i.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: i.title, fnsku: i.fnsku, quantity: i.quantity }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setBusy(false);
        return setMsg(j.error === "fnsku" ? `FNSKU for "${i.title}" must be 10 letters/digits (X00… or B0…).` : "Couldn't save.");
      }
    }
    setBusy(false);
    setMsg("Saved. The customer sees the change in the order history.");
    router.refresh();
  }

  const css = `
    .fp-label{width:${s.w}in;height:${s.h}in;box-sizing:border-box;padding:0.06in ${s.w >= 2.25 ? 0.25 : 0.2}in;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif}
    .fp-bc{width:100%;height:${s.h * 0.42}in}
    .fp-code{font-size:${s.h >= 1.2 ? 10 : 8.5}pt;font-weight:700;letter-spacing:0.5px;line-height:1.1}
    .fp-title{font-size:${s.h >= 1.2 ? 7 : 6}pt;line-height:1.1;max-height:2.2em;overflow:hidden;text-align:center;width:100%}
    .fp-cond{font-size:${s.h >= 1.2 ? 7 : 6}pt;font-weight:700;line-height:1.1}
    .fp-sheet{display:grid;grid-template-columns:repeat(3,2.625in);column-gap:0.125in;grid-auto-rows:1in;padding:0.5in 0.1875in 0;width:8.5in;box-sizing:border-box}
    @media print{
      @page{size:${s.sheet ? "letter" : `${s.w}in ${s.h}in`};margin:0}
      html,body{margin:0!important;padding:0!important;background:#fff!important}
      body>*:not(#fp-print){display:none!important}
      #fp-print{display:block!important}
      ${s.sheet ? ".fp-sheet{page-break-after:always}" : ".fp-label{page-break-after:always}"}
    }
  `;

  const sheets = s.sheet ? Array.from({ length: Math.ceil(labels.length / 30) }, (_, p) => labels.slice(p * 30, p * 30 + 30)) : [];

  return (
    <div className="max-w-5xl">
      <style>{css}</style>
      <Link href={`/admin/orders/${orderId}`} className="text-sm font-semibold text-ink-soft hover:text-ink">Back to {orderRef}</Link>
      <h1 className="h-page mt-2">FNSKU labels</h1>
      <p className="mt-1 text-ink-soft">One label per unit. The count starts at what the customer ordered; change it if the delivery count differs.</p>

      <div className="panel mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-[14px]">
          <thead className="border-b border-line text-left text-[13px] text-ink-soft">
            <tr>
              <th className="px-4 py-2.5 font-medium">Product name on label</th>
              <th className="px-4 py-2.5 font-medium">FNSKU</th>
              <th className="px-4 py-2.5 font-medium">Ordered qty</th>
              <th className="px-4 py-2.5 font-medium">Labels to print</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((i) => (
              <tr key={i.id}>
                <td className="px-4 py-2"><input className="field" value={i.title} onChange={(e) => set(i.id, { title: e.target.value })} /></td>
                <td className="px-4 py-2">
                  <input
                    className={`field tnum w-36 uppercase ${i.fnsku && !FNSKU_RE.test(i.fnsku) ? "border-red-600" : ""}`}
                    value={i.fnsku}
                    placeholder="X00…"
                    maxLength={10}
                    onChange={(e) => set(i.id, { fnsku: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })}
                  />
                </td>
                <td className="px-4 py-2">
                  <input type="number" min={1} className="field tnum w-24" value={i.quantity} onChange={(e) => set(i.id, { quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })} />
                  {i.receivedQty != null && <div className="tnum mt-1 text-[12px] text-ink-soft">{i.receivedQty} received</div>}
                </td>
                <td className="px-4 py-2">
                  <input type="number" min={0} className="field tnum w-24" value={counts[i.id] ?? 0} onChange={(e) => setCounts((c) => ({ ...c, [i.id]: Math.max(0, parseInt(e.target.value, 10) || 0) }))} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="sz">Label stock</label>
          <select id="sz" className="field" value={size} onChange={(e) => setSize(e.target.value as SizeKey)}>
            {Object.entries(SIZES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="cd">Condition</label>
          <select id="cd" className="field" value={cond} onChange={(e) => setCond(e.target.value)}>
            <option>New</option>
            <option>Used - Like New</option>
            <option>Used - Very Good</option>
            <option>Used - Good</option>
          </select>
        </div>
        {dirty.length > 0 && <button type="button" onClick={save} disabled={busy} className="btn-ghost">{busy ? "Saving…" : `Save ${dirty.length} change${dirty.length > 1 ? "s" : ""}`}</button>}
        <button type="button" onClick={() => window.print()} disabled={!labels.length} className="btn-fox">Print {labels.length.toLocaleString()} labels</button>
      </div>
      {bad.length > 0 && <p className="mt-3 rounded-md bg-fox-tint px-3 py-2 text-sm font-medium text-fox-dark">No valid FNSKU for: {bad.map((b) => b.title).join(", ")}. These are skipped.</p>}
      {msg && <p className="mt-3 text-sm font-medium">{msg}</p>}
      <p className="mt-3 text-[13px] text-ink-soft">In the print dialog choose your label printer, set scale to 100% (Actual size) and turn off headers and footers.</p>

      <h2 className="mb-2 mt-8 text-lg font-bold">Preview</h2>
      <div className="flex flex-wrap gap-3">
        {items.filter((i) => FNSKU_RE.test(i.fnsku)).map((i) => (
          <div key={i.id} className="border border-line shadow-sm"><Label item={i} cond={cond} /></div>
        ))}
      </div>

      {/* What actually prints */}
      {mounted && createPortal(
      <div id="fp-print" aria-hidden style={{ display: "none" }}>
        {s.sheet
          ? sheets.map((page, p) => (
              <div key={p} className="fp-sheet">
                {page.map((i, n) => <Label key={n} item={i} cond={cond} />)}
              </div>
            ))
          : labels.map((i, n) => <Label key={n} item={i} cond={cond} />)}
      </div>, document.body)}
    </div>
  );
}
