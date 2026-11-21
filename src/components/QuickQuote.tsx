"use client";

import Link from "next/link";
import { Barcode } from "./Barcode";
import { followUnits, type ServiceValues } from "./ServicePicker";
import { money, type Channel, type Quote, type ServiceCode } from "@/lib/pricing";
import { useI18n } from "@/i18n/client";
import { L } from "@/i18n/labels";

const EXTRAS: { code: ServiceCode }[] = [{ code: "polybag" }, { code: "bubble" }, { code: "bundle" }];

export interface QuoteState {
  channel: Channel;
  setChannel: (c: Channel) => void;
  units: number;
  setUnits: (n: number) => void;
  services: ServiceValues;
  setServices: (v: ServiceValues) => void;
  q: Quote;
  startHref: string;
  open: boolean;
  onToggle: () => void;
}

/** The hero: a 4×6 thermal label that prices a shipment as you change it. */
export function QuickQuote({ channel, setChannel, units, setUnits: rawSetUnits, services, setServices, q, startHref, open, onToggle }: QuoteState) {
  const { t } = useI18n();
  const setUnits = (fn: number | ((u: number) => number)) => {
    const next = typeof fn === "function" ? fn(units) : fn;
    setServices(followUnits(services, units, next));
    rawSetUnits(next);
  };
  const extras = EXTRAS.map((e) => e.code).filter((c) => (services[c] ?? 0) > 0);
  const added = Object.keys(services).filter((c) => (services[c as ServiceCode] ?? 0) > 0 && !EXTRAS.some((e) => e.code === c)).length;
  const ref = `IN-${(units * 7 + extras.length * 131 + channel.length).toString(36).toUpperCase().padStart(6, "Q")}`;

  return (
    <div className="relative mx-auto w-full max-w-[400px]">
      <div className="tape absolute -top-3 left-1/2 z-10 h-7 w-40 -translate-x-1/2 rotate-[-2deg] opacity-90" aria-hidden />
      <div dir="ltr" className="thermal print-in relative rotate-[1.2deg] rounded-[3px] border-[3px] border-black p-0 text-black">
        <div className="flex items-stretch border-b-[3px] border-black">
          <div className="flex-1 p-3">
            <div className="text-[10px] font-bold">{t("label.shipTo", "SHIP TO")}</div>
            <div className="wide text-[19px] font-extrabold leading-tight">FOXPREP</div>
            <div className="text-[12px] leading-snug">{t("label.where", "Prep center, Hamilton ON, Canada")}</div>
          </div>
          <div className="flex w-[92px] flex-col items-center justify-center border-l-[3px] border-black bg-black text-white">
            <div className="text-[10px] font-bold">{t("label.channel", "CHANNEL")}</div>
            <div className="wide text-[22px] font-black">{channel}</div>
          </div>
        </div>

        <div className="border-b-[3px] border-black p-3">
          <div className="mb-2 text-[10px] font-bold" id="qq-channel">{t("label.sendTo", "SEND TO")}</div>
          <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-labelledby="qq-channel">
            {(["FBA", "WFS", "FBM"] as Channel[]).map((c) => (
              <button
                key={c}
                role="radio"
                aria-checked={channel === c}
                onClick={() => setChannel(c)}
                className={`rounded-[3px] border-2 border-black px-2 py-1.5 text-[12px] font-bold transition-colors ${channel === c ? "bg-black text-white" : "bg-white hover:bg-black/5"}`}
                title={L.channel(t, c)}
              >
                {c === "FBA" ? "Amazon" : c === "WFS" ? "Walmart" : "FBM"}
              </button>
            ))}
          </div>

          <label htmlFor="qq-units" className="mb-1 mt-3 flex items-baseline justify-between text-[10px] font-bold">
            <span>{t("label.units", "UNITS")}</span>
            <span className="tnum text-[11px] font-semibold">{t("label.tier", "Tier {tier}", { tier: q.tierLabel })}</span>
          </label>
          <div className="flex items-center gap-2">
            <button aria-label={t("label.fewer", "Fewer units")} className="h-9 w-9 rounded-[3px] border-2 border-black text-lg font-bold" onClick={() => setUnits((u) => Math.max(50, u - 50))}>−</button>
            <input
              id="qq-units"
              type="number"
              inputMode="numeric"
              min={1}
              value={units}
              onChange={(e) => setUnits(Math.max(1, Math.min(99999, parseInt(e.target.value, 10) || 1)))}
              className="tnum h-9 w-full rounded-[3px] border-2 border-black text-center text-[18px] font-extrabold focus:outline-none"
            />
            <button aria-label={t("label.more", "More units")} className="h-9 w-9 rounded-[3px] border-2 border-black text-lg font-bold" onClick={() => setUnits((u) => u + 50)}>+</button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {EXTRAS.map((e) => {
              const on = extras.includes(e.code);
              return (
                <button
                  key={e.code}
                  aria-pressed={on}
                  onClick={() => {
                    const next = { ...services };
                    if (on) delete next[e.code];
                    else next[e.code] = units;
                    setServices(next);
                  }}
                  className={`rounded-full border-2 border-black px-3 py-1 text-[12px] font-bold ${on ? "bg-[#E8590C] text-white" : "bg-white"}`}
                >
                  {on ? "✓ " : "+ "}{L.svcName(t, e.code)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] border-b-[3px] border-black">
          <div className="p-3">
            <div className="text-[10px] font-bold">{t("label.estimate", "ESTIMATE, BEFORE HST")}</div>
            {q.customQuote ? (
              <div className="wide text-[30px] font-black leading-none">{t("label.custom", "Custom")}</div>
            ) : (
              <div className="tnum wide text-[34px] font-black leading-none">{money(q.subtotalCents)}</div>
            )}
            <div className="tnum mt-1 text-[12px]">
              {q.customQuote
                ? t("label.customNote", "5,000+ units get a quote within a day")
                : t("label.perUnit", "{per} per unit, {total} with HST", { per: money(q.perUnitCents), total: money(q.totalCents) })}
            </div>
          </div>
          <div className="flex w-[92px] flex-col items-center justify-center border-l-[3px] border-black">
            <div className="text-[10px] font-bold">{t("label.turnaround", "TURNAROUND")}</div>
            <div dir="ltr" className="wide text-[22px] font-black leading-none">24–48</div>
            <div className="text-[10px] font-bold">{t("label.hours", "HOURS")}</div>
          </div>
        </div>

        <div className="px-3 pb-2 pt-3">
          <Barcode value={ref} height={46} className="w-full" />
          <div className="tnum mt-1 text-center text-[11px] font-bold">{ref}</div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href={startHref} className="btn-fox">
          {t("quote.start", "Start this order")}
        </Link>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls="all-services"
          className="btn-ghost"
        >
          {open ? t("quote.hide", "Hide services") : t("quote.all", "All services and breakdown")}
          {added > 0 && !open && <span className="tnum rounded-full bg-fox px-2 py-0.5 text-xs text-white">+{added}</span>}
          <span aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
        </button>
      </div>
    </div>
  );
}
