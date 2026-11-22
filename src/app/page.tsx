import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { HeroQuote } from "@/components/HeroQuote";
import { Logo } from "@/components/Logo";
import { WhatsAppButton, WhatsAppLink, WhatsAppIcon } from "@/components/WhatsApp";
import { getSession } from "@/lib/auth";
import { getI18n } from "@/i18n/server";
import { L } from "@/i18n/labels";
import { FREE_STORAGE_DAYS, MAX_PALLETS_PER_ORDER, SERVICES, STORAGE, TIERS, rateLabel, type Service } from "@/lib/pricing";

function RateCell({ s, tier }: { s: Service; tier: 0 | 1 | 2 }) {
  const r = typeof s.rate === "number" ? s.rate : s.rate[tier];
  return <td className="tnum px-4 py-3 text-end font-semibold">{rateLabel(r)}</td>;
}

export default async function Home() {
  const session = await getSession();
  const tiered = SERVICES.filter((s) => typeof s.rate !== "number");
  const flat = SERVICES.filter((s) => typeof s.rate === "number");
  const { t } = await getI18n();
  const money2 = (c: number) => `$${(c / 100).toFixed(0)}`;

  const STEPS = [
    {
      t: t("how.1.t", "Build the order in your cart"),
      d: t("how.1.d", "Pick Amazon, Walmart or FBM, enter the unit count and tick the services you need. The price updates as you go, HST included. Pay from your balance or by card."),
    },
    {
      t: t("how.2.t", "Give our address to your supplier"),
      d: t("how.2.d", "After payment you get our Hamilton address with your customer code and order number on it. Your supplier in China or anywhere else prints that on every carton."),
    },
    {
      t: t("how.3.t", "We receive, check and prep"),
      d: t("how.3.d", "We count every carton against your order and send you photos. Then we label, bag, bundle or wrap exactly as you asked. Most orders are done in 24–48 hours."),
    },
    {
      t: t("how.4.t", "We ship it out"),
      d: t("how.4.d", "Cartons or pallets go to the Amazon or Walmart fulfillment center on your shipment plan. For FBM we keep the stock on our shelves and ship each order as it comes in."),
    },
  ];

  const FAQ = [
    {
      q: t("faq.why.q", "Why do I need a prep center now?"),
      a: t("faq.why.a", "Amazon stopped offering its own prep and item labeling service for FBA shipments in Canada on July 1, 2026. Inventory now has to arrive at Amazon already labeled and packed to its rules, or it can be refused or charged for."),
    },
    {
      q: t("faq.china.q", "Can my supplier in China ship straight to you?"),
      a: t("faq.china.a", "Yes, that's how most of our customers work. You stay the importer of record and handle customs and duties with your freight forwarder. We receive the cartons here in Hamilton."),
    },
    {
      q: t("faq.tier.q", "How is the tier decided?"),
      a: t("faq.tier.a", "By the number of units in one inbound order. 1–999 units pay the first rate, 1,000–1,999 the second, 2,000–4,999 the third. From 5,000 units we quote a custom rate."),
    },
    {
      q: t("faq.plan.q", "Who creates the Amazon shipment plan?"),
      a: t("faq.plan.a", "You create it in Seller Central (or we can do it with your permission) and upload the box and pallet labels to the order. Connect your Amazon store in the dashboard and we can see your SKUs, FNSKUs and stock."),
    },
    {
      q: t("faq.labels.q", "Which labels do I need to send you?"),
      a: t("faq.labels.a", "Unit labels: we print them from the FNSKU you add to each product. Box and carrier labels: when prep is done we post the box count, sizes and weights on your order, you create the shipment in Seller Central or Seller Center, and upload the label PDFs to the order. Each order page lists exactly what's needed."),
    },
    {
      q: t("faq.pallets.q", "Can you receive pallets?"),
      a: t("faq.pallets.a", "Yes, up to {max} standard 48×40 pallets per order, up to 1,000 kg each. For more, message us first so we can make room. Book the freight with liftgate delivery, because we don't have a loading dock. We don't unload full containers; send those to a cross-dock and have pallets delivered from there.", { max: MAX_PALLETS_PER_ORDER }),
    },
    {
      q: t("faq.fbmship.q", "Who pays for FBM shipping?"),
      a: t("faq.fbmship.a", "You buy the shipping label yourself, through Amazon Buy Shipping, Shopify, Chit Chats, Stallion or Canada Post, and upload it to the order. Our FBM fee covers picking, packing and attaching the label, so you pay postage at your own rates with no markup from us."),
    },
    {
      q: t("faq.fee.q", "Is there a monthly fee or minimum?"),
      a: t("faq.fee.a", "No monthly fee and no minimum order. Storage is free for the first {days} days after an order is received.", { days: FREE_STORAGE_DAYS }),
    },
    {
      q: t("faq.storage.q", "How long can you store my inventory?"),
      a: t(
        "faq.storage.a",
        "We're a prep center, not a long-term warehouse, so storage is priced to keep stock moving. The first {free} days are free, then {pallet} a pallet or {box} a box per month, doubling after {long} days. Pallets can stay up to {max} days and we hold at most {count} pallets per customer at a time. After {max} days we ship pallets back or to an address you choose, at your cost. FBM stock on our shelves has no time limit.",
        { free: FREE_STORAGE_DAYS, pallet: money2(STORAGE.palletMonth), box: money2(STORAGE.boxMonth), long: STORAGE.longAfterDays, max: STORAGE.palletMaxDays, count: STORAGE.maxPalletsPerCustomer },
      ),
    },
    {
      q: t("faq.balance.q", "How does the balance work?"),
      a: t("faq.balance.a", "Add funds by card and every order is paid from it in one click. Every charge, refund and top-up shows up in your balance history, so you always see where the money went."),
    },
  ];

  return (
    <>
      <SiteHeader signedIn={!!session} />
      <main>
        {/* Hero */}
        <section className="relative border-b border-line">
          <HeroQuote signedIn={!!session}>
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1 text-[13px] font-semibold text-white">
                <span className="h-2 w-2 rounded-full bg-fox" aria-hidden /> {t("hero.badge", "Amazon FBA, Walmart WFS and FBM prep in Hamilton, Ontario")}
              </p>
              <h1 className="wide text-[42px] font-black leading-[0.98] tracking-[-0.02em] text-ink sm:text-[56px] lg:text-[68px]">
                {t("hero.title", "Your supplier ships to Hamilton. We ship to Amazon.")}
              </h1>
              <p className="mt-6 max-w-[34rem] text-[18px] leading-relaxed text-ink-2">
                {t("hero.lead", "Labeling, poly bags, bundles, cartons and pallets at prices you can see before you sign up. Order in a cart, pay from your balance, and follow every carton from the moment it reaches us to the fulfillment center.")}
              </p>
              <dl className="mt-9 grid max-w-[34rem] grid-cols-3 gap-4 border-t border-line pt-6">
                <div>
                  <dt className="text-[13px] text-ink-soft">{t("hero.stat.from", "FBA prep from")}</dt>
                  <dd dir="ltr" className="tnum wide text-xl font-extrabold sm:text-2xl rtl:text-end">45¢<span className="text-base font-semibold text-ink-soft">/{L.basis(t, "unit")}</span></dd>
                </div>
                <div>
                  <dt className="text-[13px] text-ink-soft">{t("hero.stat.turnaround", "Turnaround")}</dt>
                  <dd dir="ltr" className="wide text-xl font-extrabold sm:text-2xl rtl:text-end">24–48h</dd>
                </div>
                <div>
                  <dt className="text-[13px] text-ink-soft">{t("hero.stat.storage", "Free storage")}</dt>
                  <dd className="wide text-xl font-extrabold sm:text-2xl">{t("hero.stat.days", "{n} days", { n: FREE_STORAGE_DAYS })}</dd>
                </div>
              </dl>
            </div>
          </HeroQuote>
        </section>

        {/* Context */}
        <section className="bg-ink text-white">
          <div className="mx-auto flex max-w-page flex-col gap-4 px-5 py-8 md:flex-row md:items-center md:justify-between">
            <p className="max-w-3xl text-[17px] leading-relaxed">
              <strong className="text-fox">{t("context.since", "Since July 1, 2026")}</strong> {t("context.body", "Amazon no longer preps or labels FBA inventory in Canada. Units have to arrive ready, so the label, the bag and the box are now your job, or ours.")}
            </p>
            <a href="#rates" className="btn shrink-0 bg-white text-ink hover:bg-fox-tint">{t("context.cta", "See our rates")}</a>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 border-b border-line">
          <div className="mx-auto max-w-page px-5 py-20">
            <h2 className="wide max-w-2xl text-[34px] font-black leading-tight tracking-tight md:text-[44px]">{t("how.title", "From your supplier's truck to the fulfillment center in four steps")}</h2>
            <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-4">
              {STEPS.map((s, i) => (
                <li key={s.t} className="bg-white p-6">
                  <span className="wide flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink text-lg font-black">{i + 1}</span>
                  <h3 className="mt-5 text-[18px] font-bold leading-snug">{s.t}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Rates */}
        <section id="rates" className="scroll-mt-20 border-b border-line bg-white">
          <div className="mx-auto max-w-page px-5 py-20">
            <div className="max-w-2xl">
              <h2 className="wide text-[34px] font-black leading-tight tracking-tight md:text-[44px]">{t("rates.title", "Rates")}</h2>
              <p className="mt-3 text-[17px] leading-relaxed text-ink-2">
                {t("rates.lead", "In Canadian dollars, before 13% HST. The tier is set by the units in one inbound order. No setup fee, no monthly fee, no minimum.")}
              </p>
            </div>

            <ul className="mt-10 space-y-4 md:hidden">
              {tiered.map((s) => (
                <li key={s.code} className="rounded-lg border-2 border-ink bg-white">
                  <div className="border-b border-line px-4 py-3">
                    <div className="font-semibold">{L.svcName(t, s)} <span className="font-normal text-ink-soft">/ {L.basis(t, s.basis)}</span></div>
                    <div className="text-[13px] text-ink-soft">{L.svcDetail(t, s)}</div>
                  </div>
                  <dl className="tnum grid grid-cols-2 gap-px bg-line text-[14px]">
                    {TIERS.map((tier, i) => (
                      <div key={tier.label} className="bg-white px-4 py-2.5">
                        <dt className="text-[12.5px] text-ink-soft">{tier.label}</dt>
                        <dd className="font-bold">{rateLabel(typeof s.rate === "number" ? s.rate : s.rate[i])}</dd>
                      </div>
                    ))}
                    <div className="bg-white px-4 py-2.5"><dt className="text-[12.5px] text-ink-soft">5,000+</dt><dd className="font-bold text-fox">{t("rates.custom", "Custom quote")}</dd></div>
                  </dl>
                </li>
              ))}
            </ul>

            <div className="mt-10 hidden overflow-x-auto rounded-lg border-2 border-ink md:block">
              <table className="w-full min-w-[640px] text-[15px]">
                <caption className="sr-only">{t("rates.caption", "Volume-tiered rates")}</caption>
                <thead className="bg-ink text-white">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-start font-semibold">{t("rates.service", "Service")}</th>
                    {TIERS.map((tier) => (
                      <th key={tier.label} scope="col" className="tnum px-4 py-3 text-end font-semibold">{tier.label} {L.basisPlural(t, "unit")}</th>
                    ))}
                    <th scope="col" className="px-4 py-3 text-end font-semibold">5,000+</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {tiered.map((s) => (
                    <tr key={s.code}>
                      <th scope="row" className="px-4 py-3 text-start font-normal">
                        <span className="block font-semibold">{L.svcName(t, s)} <span className="font-normal text-ink-soft">/ {L.basis(t, s.basis)}</span></span>
                        <span className="block text-[13px] text-ink-soft">{L.svcDetail(t, s)}{s.code === "fbm_pick" ? `. ${t("rates.fbmTier", "Tier by orders per month.")}` : ""}</span>
                      </th>
                      <RateCell s={s} tier={0} />
                      <RateCell s={s} tier={1} />
                      <RateCell s={s} tier={2} />
                      <td className="px-4 py-3 text-end font-semibold text-fox">{t("rates.custom", "Custom quote")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-10 grid gap-x-12 gap-y-10 md:grid-cols-2">
              {(["packaging", "cartons", "pallets", "fbm"] as const).map((g) => {
                const items = flat.filter((s) => s.group === g);
                const titles = {
                  packaging: t("rates.g.packaging", "Packaging and labels"),
                  cartons: t("rates.g.cartons", "Cartons"),
                  pallets: t("rates.g.pallets", "Pallets"),
                  fbm: t("rates.g.fbm", "FBM extras"),
                };
                return (
                  <div key={g}>
                    <h3 className="wide border-b-2 border-ink pb-2 text-lg font-extrabold">{titles[g]}</h3>
                    <ul className="divide-y divide-line">
                      {items.map((s) => (
                        <li key={s.code} className="flex items-baseline justify-between gap-4 py-3">
                          <span>
                            <span className="block text-[15px] font-semibold">{L.svcName(t, s)}</span>
                            <span className="block text-[13px] text-ink-soft">{L.svcDetail(t, s)}</span>
                          </span>
                          <span className="tnum shrink-0 text-[15px] font-bold">
                            {rateLabel(s.rate as number)}<span className="font-normal text-ink-soft"> / {L.basis(t, s.basis)}</span>
                          </span>
                        </li>
                      ))}
                      {g === "pallets" && (
                        <>
                          <li className="flex items-baseline justify-between gap-4 py-3">
                            <span>
                              <span className="block text-[15px] font-semibold">{t("rates.st1", "Storage, first {n} days", { n: FREE_STORAGE_DAYS })}</span>
                              <span className="block text-[13px] text-ink-soft">{t("rates.st1d", "Counted from the day we receive your order")}</span>
                            </span>
                            <span className="shrink-0 text-[15px] font-bold text-ok">{t("rates.free", "Free")}</span>
                          </li>
                          <li className="flex items-baseline justify-between gap-4 py-3">
                            <span>
                              <span className="block text-[15px] font-semibold">{t("rates.st2", "Storage, day {a}–{b}", { a: FREE_STORAGE_DAYS + 1, b: STORAGE.longAfterDays })}</span>
                              <span className="block text-[13px] text-ink-soft">{t("rates.perMonth", "Per month")}</span>
                            </span>
                            <span className="tnum shrink-0 text-end text-[15px] font-bold">{rateLabel(STORAGE.palletMonth)} / {L.basis(t, "pallet")}<br /><span className="font-normal">{rateLabel(STORAGE.boxMonth)} / {t("basis.box", "box")}</span></span>
                          </li>
                          <li className="flex items-baseline justify-between gap-4 py-3">
                            <span>
                              <span className="block text-[15px] font-semibold">{t("rates.st3", "Storage, after {n} days", { n: STORAGE.longAfterDays })}</span>
                              <span className="block text-[13px] text-ink-soft">{t("rates.st3d", "Pallets up to {days} days, max {n} per customer", { days: STORAGE.palletMaxDays, n: STORAGE.maxPalletsPerCustomer })}</span>
                            </span>
                            <span className="tnum shrink-0 text-end text-[15px] font-bold">{rateLabel(STORAGE.palletLongMonth)} / {L.basis(t, "pallet")}<br /><span className="font-normal">{rateLabel(STORAGE.boxLongMonth)} / {t("basis.box", "box")}</span></span>
                          </li>
                        </>
                      )}
                      {g === "fbm" && (
                        <li className="flex items-baseline justify-between gap-4 py-3">
                          <span>
                            <span className="block text-[15px] font-semibold">{t("rates.returns", "Returns")}</span>
                            <span className="block text-[13px] text-ink-soft">{t("rates.returnsD", "Open, inspect, photograph, restock or set aside")}</span>
                          </span>
                          <span className="tnum shrink-0 text-[15px] font-bold">$1.50<span className="font-normal text-ink-soft"> / {L.basis(t, "unit")}</span></span>
                        </li>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
            <p className="mt-8 text-[14px] text-ink-soft">
              {t("rates.note", "Photos of every inbound shipment and a basic count and damage check are always free. Work outside this list, like repacking damaged supplier cartons, is billed at $35 an hour, and we ask before we start.")}
            </p>
          </div>
        </section>

        {/* Why */}
        <section className="border-b border-line bg-kraft-light/50">
          <div className="mx-auto grid max-w-page gap-12 px-5 py-20 md:grid-cols-[1fr_1.4fr]">
            <h2 className="wide text-[34px] font-black leading-tight tracking-tight md:text-[44px]">{t("why.title", "What you get with every order")}</h2>
            <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {[
                [t("why.1.t", "Photos on arrival"), t("why.1.d", "We photograph your cartons when they arrive and flag damage or short counts the same day.")],
                [t("why.2.t", "Your stores, connected"), t("why.2.d", "Link Amazon Seller Central or Walmart Seller Center and pick products straight from your listings.")],
                [t("why.3.t", "One balance, full history"), t("why.3.d", "Top up once and pay each order in a click. Every charge and refund is itemized.")],
                [t("why.4.t", "Close to the highway"), t("why.4.d", "Hamilton sits on the QEW and the 403, so carriers pick up fast and Amazon's Ontario fulfillment centers are close.")],
              ].map(([title, d]) => (
                <div key={title} className="border-t-2 border-ink pt-4">
                  <dt className="text-[17px] font-bold">{title}</dt>
                  <dd className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{d}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 border-b border-line">
          <div className="mx-auto grid max-w-page gap-10 px-5 py-20 md:grid-cols-[1fr_1.4fr]">
            <h2 className="wide text-[34px] font-black leading-tight tracking-tight md:text-[44px]">{t("faq.title", "Questions sellers ask us")}</h2>
            <div className="divide-y divide-line border-y border-line">
              {FAQ.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold">
                    {f.q}
                    <span className="wide text-2xl font-black text-fox transition-transform group-open:rotate-45" aria-hidden>+</span>
                  </summary>
                  <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-ink-2">{f.a}</p>
                </details>
              ))}
              <WhatsAppLink className="mt-6 inline-flex items-center gap-2 rounded-md border-2 border-ink px-4 py-2.5 font-semibold hover:bg-ink hover:text-white" text="Hi FoxPrep, I have a question before I send inventory.">
                <WhatsAppIcon className="h-5 w-5 text-[#25D366]" /> {t("faq.wa", "Ask us on WhatsApp")}
              </WhatsAppLink>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-fox text-white">
          <div className="mx-auto flex max-w-page flex-col items-start gap-6 px-5 py-16 md:flex-row md:items-center md:justify-between">
            <h2 className="wide max-w-2xl text-[32px] font-black leading-tight tracking-tight md:text-[40px]">{t("cta.title", "Open an account and get our address in two minutes.")}</h2>
            <Link href={session ? "/dashboard/orders/new" : "/register"} className="btn shrink-0 bg-ink px-7 py-4 text-white hover:bg-black">
              {session ? t("cta.start", "Start an order") : t("cta.register", "Create free account")}
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-ink text-white/80">
        <div className="mx-auto flex max-w-page flex-col gap-6 px-5 py-10 text-[14px] md:flex-row md:items-center md:justify-between">
          <Logo light />
          <p>{t("footer.where", "FoxPrep prep center, Hamilton, Ontario, Canada")}</p>
          <WhatsAppLink className="inline-flex items-center gap-2 font-semibold text-white hover:text-fox"><WhatsAppIcon className="h-5 w-5" /> WhatsApp</WhatsAppLink>
          <Link href="/terms" className="font-semibold text-white hover:text-fox">{t("footer.terms", "Terms and prohibited items")}</Link>
          <p>{t("footer.prices", "Prices in CAD, before 13% HST. FBA prep from 45¢ a unit.")}</p>
        </div>
      </footer>
      <WhatsAppButton label={t("wa.button", "WhatsApp us")} />
    </>
  );
}
