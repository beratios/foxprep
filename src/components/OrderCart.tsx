"use client";

import { WhatsAppLink } from "./WhatsApp";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ServicePicker, followUnits, type ServiceValues } from "./ServicePicker";
import { QuoteSummary } from "./QuoteSummary";
import { CHANNEL_LABEL, MAX_PALLETS_PER_ORDER, money, quote, type Channel } from "@/lib/pricing";

interface P { id: string; title: string; sku: string; asin: string | null; fnsku: string | null; provider: string | null }
interface Item { key: string; productId?: string; title: string; sku?: string; asin?: string; fnsku?: string; url?: string; quantity: number }

export function OrderCart({
  initial,
  products,
  balanceCents,
  cardEnabled,
}: {
  initial: { channel: Channel; units: number; services: ServiceValues };
  products: P[];
  balanceCents: number;
  cardEnabled: boolean;
}) {
  const [channel, setChannel] = useState<Channel>(initial.channel);

  const [services, setServices] = useState<ServiceValues>(initial.services);
  const [items, setItems] = useState<Item[]>([]);
  const [pick, setPick] = useState("");
  const [draft, setDraft] = useState({ title: "", sku: "", fnsku: "", url: "", quantity: String(initial.units || "") });
  const [showErrors, setShowErrors] = useState(false);
  const productsRef = useRef<HTMLElement>(null);
  const supplierRef = useRef<HTMLInputElement>(null);
  const payRef = useRef<HTMLFieldSetElement>(null);
  const [supplierName, setSupplier] = useState("");
  const [inboundTracking, setTracking] = useState("");
  const [customerNotes, setNotes] = useState("");
  const [payment, setPayment] = useState<"WALLET" | "STRIPE">(balanceCents > 0 || !cardEnabled ? "WALLET" : "STRIPE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemUnits = items.reduce((a, i) => a + i.quantity, 0);
  // A product typed into the form but not yet added still counts, so nobody loses it by skipping "Add product"
  const draftQty = parseInt(draft.quantity, 10) || 0;
  const draftReady = Boolean(draft.title.trim() && draftQty > 0);
  // Units typed in the form count right away, before "Add product", so the price is always live
  const units = itemUnits + draftQty || initial.units;

  // Per-unit services that covered every unit keep covering every unit when the count changes
  const prevUnits = useRef(units);
  useEffect(() => {
    if (prevUnits.current !== units) setServices((v) => followUnits(v, prevUnits.current, units));
    prevUnits.current = units;
  }, [units]);

  const q = useMemo(() => quote({ channel, units, services }), [channel, units, services]);
  const short = payment === "WALLET" && balanceCents < q.totalCents;
  const tooManyPallets = (services.pallet_in ?? 0) > MAX_PALLETS_PER_ORDER;

  const fbaLike = channel !== "FBM";
  const noProducts = !items.length && !draftReady;
  const noSupplier = !supplierName.trim();
  const errProducts = showErrors && noProducts;
  const errSupplier = showErrors && noSupplier;
  const urlOk = (u: string) => !u.trim() || /^https?:\/\/\S+\.\S+/i.test(u.trim());
  const errUrl = showErrors && !urlOk(draft.url);

  function updateItems(next: Item[]) {
    setItems(next);
  }
  function addProduct(id: string) {
    const p = products.find((x) => x.id === id);
    if (!p || items.some((i) => i.productId === id)) return;
    updateItems([...items, { key: id, productId: id, title: p.title, sku: p.sku, asin: p.asin ?? undefined, fnsku: p.fnsku ?? undefined, quantity: draftQty && !draft.title.trim() ? draftQty : 100 }]);
    if (!draft.title.trim()) setDraft({ ...draft, quantity: "" });
    setPick("");
  }
  function draftItem(): Item {
    return { key: crypto.randomUUID(), title: draft.title.trim(), sku: draft.sku.trim() || undefined, fnsku: draft.fnsku.trim() || undefined, url: draft.url.trim() || undefined, quantity: draftQty };
  }
  function addManual() {
    if (!draftReady) return;
    if (!urlOk(draft.url)) return setShowErrors(true);
    updateItems([...items, draftItem()]);
    setDraft({ title: "", sku: "", fnsku: "", url: "", quantity: "" });
  }

  function goTo(el: HTMLElement | null) {
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    if (el instanceof HTMLInputElement) setTimeout(() => el.focus({ preventScroll: true }), 300);
  }

  async function submit() {
    // Instead of a dead button: point at the first thing that's missing
    if (noProducts || noSupplier || !urlOk(draft.url)) {
      setShowErrors(true);
      setError("Fill in the fields marked in red.");
      goTo(noProducts || !urlOk(draft.url) ? productsRef.current : supplierRef.current);
      return;
    }
    if (tooManyPallets) return setError(`We take up to ${MAX_PALLETS_PER_ORDER} inbound pallets per order. Lower the pallet count or message us first.`);
    if (short) {
      setError(`Your balance is ${money(q.totalCents - balanceCents)} short. Top up or pay by card.`);
      return goTo(payRef.current);
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel,
        units,
        services: Object.fromEntries(Object.entries(services).filter(([, v]) => v && v > 0)),
        items: [...items, ...(draftReady ? [draftItem()] : [])].map(({ key: _k, ...i }) => i),
        supplierName,
        inboundTracking,
        customerNotes,
        payment,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.url) return void (window.location.href = json.url);
    setBusy(false);
    setError(json.error || "The order couldn't be placed. Try again.");
    if (json.url) setTimeout(() => (window.location.href = json.url), 2500);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-10">
        <section>
          <fieldset>
            <legend className="mb-4 text-lg font-bold">Where is this inventory going?</legend>
            <div className="grid grid-cols-3 gap-2">
              {(["FBA", "WFS", "FBM"] as Channel[]).map((c) => (
                <label
                  key={c}
                  className={`cursor-pointer rounded-md border-2 px-3 py-2.5 text-center text-sm font-semibold transition-colors ${
                    channel === c ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink/40"
                  }`}
                >
                  <input type="radio" name="channel" value={c} checked={channel === c} onChange={() => setChannel(c)} className="sr-only" />
                  {CHANNEL_LABEL[c]}
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <section ref={productsRef} className="scroll-mt-24">
          <h2 className={`text-lg font-bold ${errProducts ? "text-red-600" : ""}`}>Products in this shipment <span className={errProducts ? "" : "text-fox-dark"}>*</span></h2>
          {errProducts && <p className="mt-1 text-sm font-semibold text-red-600">Add at least one product with its name and unit count.</p>}
          <p className="mb-4 mt-1 text-[14px] text-ink-soft">
            List every product your supplier is sending and how many. We count against this when the cartons arrive.
            {fbaLike && " Add the FNSKU if you have it, so we print the right label."}
          </p>
          {products.length > 0 && (
            <div className="mb-3 flex gap-2">
              <label htmlFor="pick" className="sr-only">Add from your products</label>
              <select id="pick" className="field" value={pick} onChange={(e) => addProduct(e.target.value)}>
                <option value="">Add from your products…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={items.some((i) => i.productId === p.id)}>
                    {p.title} ({p.sku}){p.fnsku ? ` — ${p.fnsku}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          {items.length > 0 && (
            <ul className="mb-3 divide-y divide-line rounded-lg border border-line bg-white">
              {items.map((i) => (
                <li key={i.key} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{i.title}</div>
                    <div className="tnum text-[12.5px] text-ink-soft">{[i.sku && `SKU ${i.sku}`, i.fnsku && `FNSKU ${i.fnsku}`].filter(Boolean).join(", ") || "No SKU"}</div>
                    {i.url && <a href={i.url} target="_blank" rel="noopener noreferrer" className="block truncate text-[12.5px] text-ink underline">{i.url}</a>}
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <span className="sr-only">Units of {i.title}</span>
                    <input
                      type="number"
                      min={1}
                      className="field tnum w-24 py-1.5"
                      value={i.quantity}
                      onChange={(e) => updateItems(items.map((x) => (x.key === i.key ? { ...x, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) } : x)))}
                    />
                    units
                  </label>
                  <button className="text-sm font-semibold text-fox-dark hover:underline" onClick={() => updateItems(items.filter((x) => x.key !== i.key))}>Remove</button>
                </li>
              ))}
            </ul>
          )}
          <div className={`grid grid-cols-2 gap-2 rounded-lg border border-dashed border-line p-3 ${fbaLike ? "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_110px_auto]" : "sm:grid-cols-[minmax(0,1fr)_110px_auto]"}`}>
            <input className={`field col-span-full min-w-0 ${errProducts && !draft.title.trim() ? "border-red-600 ring-1 ring-red-600" : ""}`} placeholder="Product name *" aria-label="Product name" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <input
              className={`field col-span-full min-w-0 ${errUrl ? "border-red-600 ring-1 ring-red-600" : ""}`}
              placeholder={channel === "FBA" ? "Amazon listing link (optional)" : channel === "WFS" ? "Walmart listing link (optional)" : "Product link (optional)"}
              aria-label="Product link"
              inputMode="url"
              value={draft.url}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
            />
            <input className="field min-w-0" placeholder="SKU" aria-label="SKU" value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} />
            {fbaLike && <input className="field min-w-0" placeholder="FNSKU (X00…)" aria-label="FNSKU" value={draft.fnsku} onChange={(e) => setDraft({ ...draft, fnsku: e.target.value.toUpperCase() })} />}
            <input className={`field tnum min-w-0 ${errProducts && !draftQty ? "border-red-600 ring-1 ring-red-600" : ""}`} placeholder="Units *" aria-label="Units" inputMode="numeric" value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: e.target.value.replace(/\D/g, "") })} />
            <button className="btn-ghost btn-sm whitespace-nowrap" onClick={addManual} disabled={!draftReady}>Add product</button>
          </div>
          {errUrl && <p className="mt-2 text-sm font-semibold text-red-600">The link should start with https://</p>}
          <p className="tnum mt-2 text-[13px] text-ink-soft">Total: {(itemUnits + draftQty).toLocaleString()} units</p>
          {products.length === 0 && (
            <p className="mt-2 text-[13px] text-ink-soft"><Link href="/dashboard/stores" className="font-semibold text-ink underline">Connect your Amazon or Walmart store</Link> to pick products from your listings.</p>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-lg font-bold">What should we do with it?</h2>
          <ServicePicker channel={channel} units={units} values={services} onChange={setServices} />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold">Shipment details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={`label ${errSupplier ? "!text-red-600" : ""}`} htmlFor="supplier">Supplier or sender <span className={errSupplier ? "" : "text-fox-dark"}>*</span></label>
              <input
                id="supplier"
                ref={supplierRef}
                className={`field scroll-mt-24 ${errSupplier ? "border-red-600 ring-1 ring-red-600" : ""}`}
                aria-invalid={errSupplier}
                placeholder="e.g. Shenzhen Hengli Trading"
                value={supplierName}
                onChange={(e) => setSupplier(e.target.value)}
              />
              {errSupplier && <p className="mt-1 text-sm font-semibold text-red-600">Enter who is sending the shipment.</p>}
            </div>
            <div>
              <label className="label" htmlFor="tracking">Tracking numbers <span className="font-normal text-ink-soft">(add later if you don&apos;t have them)</span></label>
              <input id="tracking" className="field" placeholder="UPS, FedEx, DHL or freight PRO" value={inboundTracking} onChange={(e) => setTracking(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="notes">Instructions for our team</label>
            <textarea id="notes" rows={4} className="field" placeholder="e.g. Bundle 2 units per pack, put the 'Sold as set' sticker on the front. Amazon shipment plan to follow." value={customerNotes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-8 lg:self-start">
        <div className="rounded-lg border-2 border-ink bg-white p-5">
          <h2 className="wide mb-4 text-lg font-extrabold">Order summary</h2>
          <QuoteSummary q={q} />
          {q.customQuote && (
            <p className="mt-3 rounded-md bg-fox-tint p-3 text-[13px] leading-snug text-fox-dark">
              5,000+ units qualify for a custom rate. You pay the listed price now and we refund the difference to your balance once your rate is set.
            </p>
          )}

          <fieldset ref={payRef} className="mt-5 scroll-mt-24">
            <legend className="label">Pay with</legend>
            <div className="space-y-2">
              <label className={`flex cursor-pointer items-center gap-3 rounded-md border-2 p-3 ${payment === "WALLET" ? "border-ink" : "border-line"}`}>
                <input type="radio" name="pay" className="accent-[#E8590C]" checked={payment === "WALLET"} onChange={() => setPayment("WALLET")} />
                <span className="flex-1 text-[15px] font-semibold">Balance</span>
                <span className={`tnum text-sm ${short ? "font-semibold text-fox-dark" : "text-ink-soft"}`}>{money(balanceCents)}</span>
              </label>
              <label className={`flex items-center gap-3 rounded-md border-2 p-3 ${!cardEnabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${payment === "STRIPE" ? "border-ink" : "border-line"}`}>
                <input type="radio" name="pay" className="accent-[#E8590C]" disabled={!cardEnabled} checked={payment === "STRIPE"} onChange={() => setPayment("STRIPE")} />
                <span className="flex-1 text-[15px] font-semibold">Card</span>
                <span className="text-sm text-ink-soft">Visa, Mastercard, Amex</span>
              </label>
            </div>
          </fieldset>

          {short && (
            <p className="mt-3 text-[13px] text-fox-dark">
              You need {money(q.totalCents - balanceCents)} more. <Link href="/dashboard/balance" className="font-semibold underline">Top up your balance</Link>{cardEnabled ? " or pay by card." : "."}
            </p>
          )}
          {tooManyPallets && (
            <p role="alert" className="mt-3 rounded-md bg-fox-tint px-3 py-2 text-[13px] font-medium text-fox-dark">
              We take up to {MAX_PALLETS_PER_ORDER} inbound pallets per order. Split the shipment or message us to book space for more. <WhatsAppLink className="underline" text="Hi FoxPrep, I need space for more than 6 pallets.">WhatsApp</WhatsAppLink>
            </p>
          )}
          {error && <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}

          <button className="btn-fox mt-5 w-full" disabled={busy} onClick={submit}>
            {busy ? "Placing order…" : payment === "WALLET" ? `Pay ${money(q.totalCents)} and place order` : `Continue to card payment`}
          </button>
          <p className="mt-3 text-center text-[12.5px] text-ink-soft">Cancel free of charge until your cartons arrive.</p>
        </div>
      </aside>
    </div>
  );
}
