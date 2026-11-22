"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CUSTOM_QUOTE_FROM,
  HST_RATE,
  SERVICES,
  TIERS,
  money,
  quote,
  rateFor,
  rateLabel,
  tierIndex,
  type Channel,
  type Service,
  type ServiceCode,
} from "@/lib/pricing";
import { defaultQty } from "./ServicePicker";
import { useI18n } from "@/i18n/client";
import { L } from "@/i18n/labels";
import { encodeCart } from "@/lib/cartParams";

const SLIDER_MAX = CUSTOM_QUOTE_FROM;
const GROUPS = ["core", "packaging", "cartons", "pallets", "fbm"] as const;

/** Per-unit services follow the unit count; everything else gets its own count. */
const followsUnits = (s: Service) => s.basis === "unit" && s.code !== "fbm_extra";

/**
 * Hero with an open price list on the right. Every rate is visible from the start;
 * ticking a service and moving the unit slider turns the list into a live estimate.
 */
export function HeroQuote({ signedIn, children }: { signedIn: boolean; children: React.ReactNode }) {
  const { t } = useI18n();
  const [channel, setChannel] = useState<Channel>("FBA");
  const [units, setUnits] = useState(0);
  const [picked, setPicked] = useState<Partial<Record<ServiceCode, number>>>({});

  const tier = tierIndex(units);
  const groups = GROUPS.map((g) => ({ g, items: SERVICES.filter((s) => s.group === g && s.channels.includes(channel)) })).filter((x) => x.items.length);

  const services = useMemo(() => {
    const out: Partial<Record<ServiceCode, number>> = {};
    for (const [code, qty] of Object.entries(picked) as [ServiceCode, number][]) {
      const s = SERVICES.find((x) => x.code === code);
      if (!s || !s.channels.includes(channel)) continue;
      out[code] = followsUnits(s) ? units : qty;
    }
    return out;
  }, [picked, units, channel]);

  const q = useMemo(() => quote({ channel, units, services }), [channel, units, services]);
  const cart = `/dashboard/orders/new?${encodeCart(channel, Math.max(units, 1), services)}`;
  const startHref = signedIn ? cart : `/register?next=${encodeURIComponent(cart)}`;

  const toggle = (s: Service) =>
    setPicked((p) => {
      const next = { ...p };
      if (next[s.code] !== undefined) delete next[s.code];
      else next[s.code] = followsUnits(s) ? 0 : defaultQty(s, units);
      return next;
    });
  const setQty = (s: Service, n: number) => setPicked((p) => ({ ...p, [s.code]: Math.max(1, Math.min(999, n)) }));
  const setUnitCount = (n: number) => setUnits(Math.max(0, Math.min(99999, Math.round(n) || 0)));

  const rateText = (s: Service) =>
    typeof s.rate === "number" ? rateLabel(s.rate) : rateLabel(rateFor(s, s.code === "fbm_pick" ? 0 : tier));

  return (
    <div className="mx-auto grid max-w-page items-start gap-12 px-5 pb-16 pt-12 md:grid-cols-[1fr_1fr] md:pb-24 md:pt-20 lg:grid-cols-[1.05fr_1fr]">
      <div className="md:pt-6">{children}</div>

      <div id="quote" className="scroll-mt-20 rounded-lg border-2 border-ink bg-white shadow-[6px_6px_0_0_#13203A]">
        {/* Channel */}
        <div className="border-b-2 border-ink p-4">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h2 className="wide text-lg font-extrabold">{t("pc.title", "Price list")}</h2>
            <span className="text-[12px] text-ink-soft">{t("pc.cad", "CAD, before HST")}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label={t("pc.channel", "Where is this stock going?")}>
            {(["FBA", "WFS", "FBM"] as Channel[]).map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={channel === c}
                onClick={() => setChannel(c)}
                className={`rounded-md border-2 border-ink px-2 py-1.5 text-[13px] font-bold transition-colors ${channel === c ? "bg-ink text-white" : "bg-white hover:bg-ink/5"}`}
              >
                {c === "FBA" ? "Amazon FBA" : c === "WFS" ? "Walmart WFS" : "FBM"}
              </button>
            ))}
          </div>
        </div>

        {/* Units */}
        <div className="border-b-2 border-ink p-4">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="pc-units" className="text-[14px] font-semibold">{t("pc.units", "Units in this shipment")}</label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={units}
              onChange={(e) => setUnitCount(parseInt(e.target.value, 10))}
              aria-label={t("pc.units", "Units in this shipment")}
              className="tnum h-9 w-24 rounded-md border-2 border-ink text-center text-[16px] font-extrabold focus:outline-none focus:ring-2 focus:ring-fox"
            />
          </div>
          <input
            id="pc-units"
            type="range"
            min={0}
            max={SLIDER_MAX}
            step={50}
            value={Math.min(units, SLIDER_MAX)}
            onChange={(e) => setUnitCount(parseInt(e.target.value, 10))}
            className="mt-3 w-full accent-[#E8590C]"
          />
          <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[11.5px]">
            {[...TIERS.map((tr, i) => ({ label: tr.label, i })), { label: "5,000+", i: 3 }].map(({ label, i }) => {
              const active = units > 0 && (i === 3 ? q.customQuote : !q.customQuote && tier === i);
              return (
                <div key={label} className={`tnum rounded px-1 py-1 ${active ? "bg-fox text-white" : "bg-paper text-ink-2"}`}>
                  <div className="font-bold">{label}</div>
                  <div>{i === 3 ? t("rates.custom", "Custom quote") : `${rateLabel(rateFor(SERVICES[channel === "FBM" ? 1 : 0], i))}`}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Services, all prices visible */}
        <div className="px-4 py-2 md:max-h-[360px] md:overflow-y-auto">
          {groups.map(({ g, items }) => (
            <div key={g} className="py-2">
              <div className="mb-1 text-[11.5px] font-bold uppercase tracking-wide text-ink-soft">{L.group(t, g)}</div>
              <ul>
                {items.map((s) => {
                  const required = !!s.requiredFor?.includes(channel);
                  const on = required || picked[s.code] !== undefined;
                  const line = q.lines.find((l) => l.code === s.code);
                  return (
                    <li key={s.code} className="flex items-center gap-3 border-b border-ink/10 py-2 last:border-0">
                      <input
                        type="checkbox"
                        checked={on}
                        disabled={required}
                        onChange={() => toggle(s)}
                        aria-label={L.svcName(t, s.code)}
                        className="h-[18px] w-[18px] shrink-0 accent-[#E8590C]"
                      />
                      <button type="button" disabled={required} onClick={() => toggle(s)} className="min-w-0 flex-1 text-start">
                        <span className="block text-[14px] font-semibold leading-tight">
                          {L.svcName(t, s.code)}
                          {required && <span className="ms-2 text-[11px] font-bold text-green-700">{t("picker.included", "Included")}</span>}
                        </span>
                        <span className="block text-[12px] leading-snug text-ink-soft">{L.svcDetail(t, s)}</span>
                      </button>
                      {on && !followsUnits(s) && !required ? (
                        <span className="flex shrink-0 items-center gap-1">
                          <button type="button" aria-label="−" onClick={() => setQty(s, (picked[s.code] ?? 1) - 1)} className="h-7 w-7 rounded border-2 border-ink text-sm font-bold">−</button>
                          <span className="tnum w-7 text-center text-[13px] font-bold">{picked[s.code]}</span>
                          <button type="button" aria-label="+" onClick={() => setQty(s, (picked[s.code] ?? 0) + 1)} className="h-7 w-7 rounded border-2 border-ink text-sm font-bold">+</button>
                        </span>
                      ) : null}
                      <span className="tnum w-[84px] shrink-0 text-end text-[13px]">
                        <span className="font-bold">{rateText(s)}</span>
                        <span className="text-ink-soft"> / {L.basis(t, s.basis)}</span>
                        {line && !q.customQuote && <span className="block font-semibold text-fox-dark">{money(line.amountCents)}</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Estimate */}
        <div className="sticky bottom-0 z-10 rounded-b-lg border-t-2 border-ink bg-paper p-4 md:static">
          {q.customQuote ? (
            <p className="text-[14px] leading-snug text-ink-2">{t("est.custom", "5,000 units or more get a custom rate. Start the order and we'll send a quote within one business day.")}</p>
          ) : (
            <dl className="tnum space-y-1 text-[14px]">
              <div className="flex justify-between text-ink-2"><dt>{t("sum.subtotal", "Subtotal")}</dt><dd>{money(q.subtotalCents)}</dd></div>
              <div className="flex justify-between text-ink-soft"><dt>HST ({Math.round(HST_RATE * 100)}%)</dt><dd>{money(q.taxCents)}</dd></div>
              <div className="flex items-baseline justify-between pt-1">
                <dt className="font-extrabold">{t("sum.total", "Total")}</dt>
                <dd className="wide text-2xl font-black">{money(q.totalCents)}</dd>
              </div>
              {units > 0 && <div className="flex justify-between text-[12.5px] text-ink-soft"><dt>{t("sum.perUnit", "Before tax, per unit")}</dt><dd>{money(q.perUnitCents)}</dd></div>}
            </dl>
          )}
          {units === 0 && !q.customQuote && (
            <p className="mt-2 text-[12.5px] text-ink-soft">{t("pc.hint", "Move the slider and tick services to see your estimate.")}</p>
          )}
          <Link href={startHref} className="btn-fox mt-3 w-full">{t("quote.start", "Start this order")}</Link>
        </div>
      </div>
    </div>
  );
}
