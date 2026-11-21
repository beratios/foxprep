"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { QuickQuote } from "./QuickQuote";
import { ServicePicker, type ServiceValues } from "./ServicePicker";
import { QuoteSummary } from "./QuoteSummary";
import { MAX_PALLETS_PER_ORDER, money, quote, type Channel } from "@/lib/pricing";
import { useI18n } from "@/i18n/client";
import { L } from "@/i18n/labels";
import { encodeCart } from "@/lib/cartParams";

/**
 * Hero with the live label on the right. "All services" unfolds the full service list
 * right under the hero, sharing the same state, so the price on the label never disagrees with the list.
 */
export function HeroQuote({ signedIn, children }: { signedIn: boolean; children: React.ReactNode }) {
  const { t } = useI18n();
  const [channel, setChannel] = useState<Channel>("FBA");
  const [units, setUnits] = useState(500);
  const [services, setServices] = useState<ServiceValues>({ polybag: 500 });
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  const q = useMemo(() => quote({ channel, units, services }), [channel, units, services]);
  const cart = `/dashboard/orders/new?${encodeCart(channel, units, services)}`;
  const startHref = signedIn ? cart : `/register?next=${encodeURIComponent(cart)}`;

  // The header's "Price a shipment" link opens the panel
  useEffect(() => {
    const check = () => window.location.hash === "#quote" && setOpen(true);
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, []);

  useEffect(() => {
    document.body.toggleAttribute("data-quote-open", open);
    return () => document.body.removeAttribute("data-quote-open");
  }, [open]);

  useEffect(() => {
    if (!open || !panel.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    panel.current.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [open]);

  return (
    <>
      <div className="mx-auto grid max-w-page items-center gap-12 px-5 pb-16 pt-12 md:grid-cols-[1.1fr_1fr] md:pb-24 md:pt-20">
        {children}
        <QuickQuote
          channel={channel}
          setChannel={setChannel}
          units={units}
          setUnits={setUnits}
          services={services}
          setServices={setServices}
          q={q}
          startHref={startHref}
          open={open}
          onToggle={() => setOpen((o) => !o)}
        />
      </div>

      <div id="quote" className="scroll-mt-16" />
      {open && (
        <div id="all-services" ref={panel} className="scroll-mt-16 border-t-2 border-ink bg-white">
          <div className="mx-auto max-w-page px-5 py-12">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="wide text-[28px] font-black leading-tight tracking-tight md:text-[34px]">{t("panel.title", "Every service for this shipment")}</h2>
                <p className="mt-1 text-[15px] text-ink-2">
                  {t("panel.sub", "{units} units to {channel}. Change those on the label above.", { units: q.units.toLocaleString(), channel: L.channel(t, channel) })}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-sm font-semibold text-ink-soft underline-offset-4 hover:text-ink hover:underline">
                {t("common.close", "Close")}
              </button>
            </div>
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <ServicePicker channel={channel} units={units} values={services} onChange={setServices} />
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-lg border-2 border-ink bg-white p-5">
                  <h3 className="wide text-lg font-extrabold">{t("est.title", "Your estimate")}</h3>
                  <p className="tnum mb-4 text-sm text-ink-soft">{t("est.sub", "{units} units, tier {tier}", { units: q.units.toLocaleString(), tier: q.tierLabel })}</p>
                  {q.customQuote ? (
                    <p className="text-[15px] leading-relaxed text-ink-2">
                      {t("est.custom", "5,000 units or more get a custom rate. Start the order and we'll send a quote within one business day.")}
                    </p>
                  ) : (
                    <QuoteSummary q={q} />
                  )}
                  {(services.pallet_in ?? 0) > MAX_PALLETS_PER_ORDER && (
                    <p className="mt-3 rounded-md bg-fox-tint px-3 py-2 text-[13px] font-medium text-fox-dark">
                      {t("est.pallets", "More than {n} pallets? Message us first so we can make room.", { n: MAX_PALLETS_PER_ORDER })}
                    </p>
                  )}
                  <Link href={startHref} className="btn-fox mt-5 w-full">{t("quote.start", "Start this order")}</Link>
                  <p className="mt-3 text-center text-[13px] text-ink-soft">{t("est.payNote", "Pay from your balance or by card. You get the shipping address right after.")}</p>
                </div>
              </aside>
            </div>
          </div>
          {/* Phones: the estimate box sits below a long list, so keep the total in reach */}
          <div className="sticky bottom-0 z-30 flex items-center justify-between gap-3 border-t-2 border-ink bg-white px-5 py-3 lg:hidden">
            <div>
              <div className="text-[12px] text-ink-soft">{t("est.totalHst", "Total with HST")}</div>
              <div className="tnum wide text-xl font-black">{q.customQuote ? t("label.custom", "Custom") : money(q.totalCents)}</div>
            </div>
            <Link href={startHref} className="btn-fox btn-sm">{t("quote.start", "Start this order")}</Link>
          </div>
        </div>
      )}
    </>
  );
}
