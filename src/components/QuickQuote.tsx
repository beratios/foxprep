"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Barcode } from "./Barcode";
import { CHANNEL_LABEL, money, quote, type Channel, type ServiceCode } from "@/lib/pricing";
import { encodeCart } from "@/lib/cartParams";

const EXTRAS: { code: ServiceCode; name: string }[] = [
  { code: "polybag", name: "Poly bag" },
  { code: "bubble", name: "Bubble wrap" },
  { code: "bundle", name: "Bundle" },
];

/** The hero: a 4×6 thermal label that prices a shipment as you change it. */
export function QuickQuote() {
  const [channel, setChannel] = useState<Channel>("FBA");
  const [units, setUnits] = useState(500);
  const [extras, setExtras] = useState<ServiceCode[]>(["polybag"]);

  const services = useMemo(() => Object.fromEntries(extras.map((c) => [c, units])), [extras, units]);
  const q = useMemo(() => quote({ channel, units, services }), [channel, units, services]);
  const ref = `IN-${(units * 7 + extras.length * 131 + channel.length).toString(36).toUpperCase().padStart(6, "Q")}`;

  return (
    <div className="relative mx-auto w-full max-w-[400px]">
      <div className="tape absolute -top-3 left-1/2 z-10 h-7 w-40 -translate-x-1/2 rotate-[-2deg] opacity-90" aria-hidden />
      <div className="thermal print-in relative rotate-[1.2deg] rounded-[3px] border-[3px] border-black p-0 text-black">
        <div className="flex items-stretch border-b-[3px] border-black">
          <div className="flex-1 p-3">
            <div className="text-[10px] font-bold">SHIP TO</div>
            <div className="wide text-[19px] font-extrabold leading-tight">FOXPREP</div>
            <div className="text-[12px] leading-snug">Prep center, Hamilton ON, Canada</div>
          </div>
          <div className="flex w-[92px] flex-col items-center justify-center border-l-[3px] border-black bg-black text-white">
            <div className="text-[10px] font-bold">CHANNEL</div>
            <div className="wide text-[22px] font-black">{channel}</div>
          </div>
        </div>

        <div className="border-b-[3px] border-black p-3">
          <div className="mb-2 text-[10px] font-bold" id="qq-channel">SEND TO</div>
          <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-labelledby="qq-channel">
            {(["FBA", "WFS", "FBM"] as Channel[]).map((c) => (
              <button
                key={c}
                role="radio"
                aria-checked={channel === c}
                onClick={() => setChannel(c)}
                className={`rounded-[3px] border-2 border-black px-2 py-1.5 text-[12px] font-bold transition-colors ${channel === c ? "bg-black text-white" : "bg-white hover:bg-black/5"}`}
                title={CHANNEL_LABEL[c]}
              >
                {c === "FBA" ? "Amazon" : c === "WFS" ? "Walmart" : "FBM"}
              </button>
            ))}
          </div>

          <label htmlFor="qq-units" className="mb-1 mt-3 flex items-baseline justify-between text-[10px] font-bold">
            <span>UNITS</span>
            <span className="tnum text-[11px] font-semibold">Tier {q.tierLabel}</span>
          </label>
          <div className="flex items-center gap-2">
            <button aria-label="Fewer units" className="h-9 w-9 rounded-[3px] border-2 border-black text-lg font-bold" onClick={() => setUnits((u) => Math.max(50, u - 50))}>−</button>
            <input
              id="qq-units"
              type="number"
              inputMode="numeric"
              min={1}
              value={units}
              onChange={(e) => setUnits(Math.max(1, Math.min(99999, parseInt(e.target.value, 10) || 1)))}
              className="tnum h-9 w-full rounded-[3px] border-2 border-black text-center text-[18px] font-extrabold focus:outline-none"
            />
            <button aria-label="More units" className="h-9 w-9 rounded-[3px] border-2 border-black text-lg font-bold" onClick={() => setUnits((u) => u + 50)}>+</button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {EXTRAS.map((e) => {
              const on = extras.includes(e.code);
              return (
                <button
                  key={e.code}
                  aria-pressed={on}
                  onClick={() => setExtras((x) => (on ? x.filter((c) => c !== e.code) : [...x, e.code]))}
                  className={`rounded-full border-2 border-black px-3 py-1 text-[12px] font-bold ${on ? "bg-[#E8590C] text-white" : "bg-white"}`}
                >
                  {on ? "✓ " : "+ "}{e.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] border-b-[3px] border-black">
          <div className="p-3">
            <div className="text-[10px] font-bold">ESTIMATE, BEFORE HST</div>
            {q.customQuote ? (
              <div className="wide text-[30px] font-black leading-none">Custom</div>
            ) : (
              <div className="tnum wide text-[34px] font-black leading-none">{money(q.subtotalCents)}</div>
            )}
            <div className="tnum mt-1 text-[12px]">
              {q.customQuote ? "5,000+ units get a quote within a day" : `${money(q.perUnitCents)} per unit, ${money(q.totalCents)} with HST`}
            </div>
          </div>
          <div className="flex w-[92px] flex-col items-center justify-center border-l-[3px] border-black">
            <div className="text-[10px] font-bold">TURNAROUND</div>
            <div className="wide text-[22px] font-black leading-none">24–48</div>
            <div className="text-[10px] font-bold">HOURS</div>
          </div>
        </div>

        <div className="px-3 pb-2 pt-3">
          <Barcode value={ref} height={46} className="w-full" />
          <div className="tnum mt-1 text-center text-[11px] font-bold">{ref}</div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href={`/register?next=${encodeURIComponent(`/dashboard/orders/new?${encodeCart(channel, units, services)}`)}`} className="btn-fox">
          Start this order
        </Link>
        <a href="#calculator" className="text-[15px] font-semibold text-ink underline decoration-fox decoration-2 underline-offset-4 hover:text-fox">
          Add more services
        </a>
      </div>
    </div>
  );
}
