"use client";

import { WhatsAppLink } from "./WhatsApp";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ServicePicker, followUnits, type ServiceValues } from "./ServicePicker";
import { QuoteSummary } from "./QuoteSummary";
import { CHANNEL_LABEL, MAX_PALLETS_PER_ORDER, quote, type Channel } from "@/lib/pricing";
import { encodeCart } from "@/lib/cartParams";

export function ChannelUnits({
  channel,
  units,
  setChannel,
  setUnits,
}: {
  channel: Channel;
  units: number;
  setChannel: (c: Channel) => void;
  setUnits: (n: number) => void;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-[1fr_200px]">
      <fieldset>
        <legend className="label">Where is this inventory going?</legend>
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
      <div>
        <label htmlFor="units" className="label">Total units</label>
        <input
          id="units"
          type="number"
          min={1}
          inputMode="numeric"
          className="field tnum text-lg font-bold"
          value={units}
          onChange={(e) => setUnits(Math.max(1, parseInt(e.target.value, 10) || 1))}
        />
      </div>
    </div>
  );
}

export function Calculator({ signedIn }: { signedIn: boolean }) {
  const [channel, setChannel] = useState<Channel>("FBA");
  const [units, setUnits] = useState(1200);
  const [services, setServices] = useState<ServiceValues>({ polybag: 1200, carton_in: 20, carton_out: 20 });
  const q = useMemo(() => quote({ channel, units, services }), [channel, units, services]);
  const cart = `/dashboard/orders/new?${encodeCart(channel, units, services)}`;
  const href = signedIn ? cart : `/register?next=${encodeURIComponent(cart)}`;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <ChannelUnits channel={channel} units={units} setChannel={setChannel} setUnits={(n) => { setServices((v) => followUnits(v, units, n)); setUnits(n); }} />
        <ServicePicker channel={channel} units={units} values={services} onChange={setServices} />
      </div>
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-lg border-2 border-ink bg-white p-5">
          <div className="mb-4">
            <h3 className="wide text-lg font-extrabold">Your estimate</h3>
            <p className="tnum text-sm text-ink-soft">{q.units.toLocaleString()} units, tier {q.tierLabel}</p>
          </div>
          {q.customQuote ? (
            <p className="text-[15px] leading-relaxed text-ink-2">
              Shipments of 5,000 units or more get a custom rate. Create an account and start the order, and we&apos;ll send a quote within one business day.
            </p>
          ) : (
            <QuoteSummary q={q} />
          )}
          {(services.pallet_in ?? 0) > MAX_PALLETS_PER_ORDER && (
            <p className="mt-3 rounded-md bg-fox-tint px-3 py-2 text-[13px] font-medium text-fox-dark">More than {MAX_PALLETS_PER_ORDER} pallets? Message us first so we can make room. <WhatsAppLink className="underline" text="Hi FoxPrep, I need space for more than 6 pallets.">WhatsApp</WhatsAppLink></p>
          )}
          <Link href={href} className="btn-fox mt-5 w-full">Start this order</Link>
          <p className="mt-3 text-center text-[13px] text-ink-soft">Pay from your balance or by card. You&apos;ll get the shipping address right after.</p>
        </div>
      </aside>
    </div>
  );
}
