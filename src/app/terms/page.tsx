import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { FREE_STORAGE_DAYS, STORAGE } from "@/lib/pricing";
import { getI18n } from "@/i18n/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const metadata: Metadata = { title: "Terms of Service and prohibited items — FoxPrep" };

const UPDATED = "November 20, 2026";

const PROHIBITED = [
  "Dangerous goods and hazmat: flammable liquids, aerosols, compressed gas, corrosives, loose lithium batteries, unless we approve them in writing first",
  "Weapons, ammunition, weapon parts, fireworks and explosives",
  "Drugs, cannabis and cannabis products, prescription medication and drug paraphernalia",
  "Alcohol, tobacco, vapes and e-liquids",
  "Perishable, refrigerated or frozen food; live animals, plants and seeds",
  "Counterfeit, replica or knock-off goods, and anything that infringes a trademark, copyright or patent",
  "Stolen goods, or goods you cannot show you have the right to sell",
  "Products recalled by Health Canada or the manufacturer",
  "Cash, gift cards, precious metals and jewellery worth more than $500 per unit",
  "Anything that is illegal to import, store or sell in Canada, or that Amazon or Walmart does not allow",
];

function H({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="wide mt-12 scroll-mt-20 text-xl font-extrabold">{children}</h2>;
}

export default async function Terms() {
  const { t, locale } = await getI18n();
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-page items-center justify-between px-5">
          <Logo />
          <div className="flex items-center gap-2"><LanguageSwitcher compact /><Link href="/register" className="btn-fox btn-sm">{t("nav.register", "Create account")}</Link></div>
        </div>
      </header>
      <main dir="ltr" lang="en" className="mx-auto max-w-[72ch] px-5 py-12 text-[15.5px] leading-relaxed text-ink-2 [&_li]:mt-2 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
        {locale !== "en" && (
          <p dir="auto" lang={locale} className="mb-6 rounded-md bg-fox-tint px-4 py-3 text-[14px] font-medium text-ink">
            {t("terms.englishOnly", "These terms are published in English. The English version is the binding one.")}
          </p>
        )}
        <h1 className="wide text-3xl font-black tracking-tight text-ink md:text-4xl">Terms of Service</h1>
        <p className="text-sm text-ink-soft">Last updated {UPDATED}</p>
        <p>
          These terms apply when you use FoxPrep (&quot;we&quot;, &quot;us&quot;) in Hamilton, Ontario, to receive, prepare, store and ship your inventory. By creating an account or
          sending goods to us, you agree to them. Jump to the <a href="#prohibited" className="font-semibold text-ink underline">prohibited items list</a>.
        </p>

        <H id="importer">1. You are the importer and the owner</H>
        <p>
          The goods you send us belong to you. You are the importer of record: your name or company must appear as importer on the commercial invoice, bill of lading and customs
          documents, never FoxPrep. You pay all duties, taxes, brokerage and carrier charges. We do not accept shipments with duties or charges due on delivery; if a carrier asks us to
          pay, we may refuse the delivery or pay it and charge the amount plus a $15 handling fee to your balance.
        </p>
        <p>You are responsible for your products being legal to import and sell, correctly labelled, safe, and allowed by Amazon, Walmart and any other marketplace you use.</p>

        <H id="prohibited">2. Prohibited items</H>
        <p>Do not send us:</p>
        <ul>{PROHIBITED.map((p) => <li key={p}>{p}</li>)}</ul>
        <p>
          We may open and inspect any shipment. If we believe something is prohibited, unsafe or not what you described, we may refuse it, stop work on it, return it at your cost, or
          report it to the authorities when the law requires or allows us to. Costs we incur because of a prohibited item are charged to you.
        </p>

        <H id="receiving">3. Receiving, counts and photos</H>
        <p>
          Every inbound shipment must match an order in your dashboard and carry its ATTN line. We count cartons and units, photograph what arrives and what leaves, and post the photos
          to your order. Our count is final unless you raise a question within 7 days of receiving it. Cartons we cannot match to an order may be held and charged $25 per hour to
          identify.
        </p>

        <H id="prep">4. Prep work</H>
        <p>
          We prepare units according to the instructions in your order and the marketplace&apos;s prep requirements as published when we do the work. You are responsible for your
          shipment plans, FNSKUs, carton and pallet labels and the information you give us. If your instructions conflict with the marketplace&apos;s rules, we will ask before going
          further.
        </p>

        <H id="payment">5. Prices, balance and payment</H>
        <p>
          Prices are listed on our website in Canadian dollars before 13% HST. Orders are paid in advance from your balance or by card. Some charges depend on what actually arrives and
          leaves, such as cartons, pallets, boxes and extra handling. When the real count differs from your order, we show you the count with photos and charge or refund the
          difference to your balance before the goods ship. Goods ship once the balance covers all charges.
        </p>
        <p>
          Your balance is a prepayment for our services, not a deposit account and does not earn interest. You can ask for unused balance to be refunded to the original payment
          method; card processing fees are not refundable.
        </p>

        <H id="storage">6. Storage and abandoned inventory</H>
        <p>
          Storage is free for {FREE_STORAGE_DAYS} days after an order is received, then charged monthly at the rates on our website. Pallets can be stored for up to{" "}
          {STORAGE.palletMaxDays} days and we hold at most {STORAGE.maxPalletsPerCustomer} pallets per customer at a time. After that, we ship them back or to an address you choose,
          at your cost.
        </p>
        <p>
          If your balance stays negative for 30 days, or you don&apos;t respond for 60 days about goods that must leave our warehouse, we will email you a final notice. If you still
          don&apos;t respond within 30 days of that notice, we may treat the goods as abandoned and return, sell or dispose of them to recover what you owe. We have a lien on your
          goods for unpaid charges.
        </p>

        <H id="liability">7. Loss, damage and our liability</H>
        <p>
          We handle your goods with reasonable care. If units are lost or damaged while in our care because of our mistake, we will refund the prep fees for those units and reimburse
          your documented landed cost per unit, up to $25 per unit and up to $2,500 per order in total. We are not responsible for normal wear of packaging, defects or damage that
          existed on arrival, losses caused by your instructions or labels, events outside our control, or loss of sales or profit.
        </p>
        <p>
          Once a shipment is handed to a carrier or to Amazon or Walmart, it is their responsibility. We will give you the tracking details and photos to help with a claim. We are not
          responsible for marketplace decisions, fees, stranded inventory or reimbursements.
        </p>
        <p>You agree to cover our costs, including reasonable legal fees, if a claim is made against us because of your goods or the information you gave us.</p>

        <H id="account">8. Your account</H>
        <p>
          Keep your login details private; you are responsible for activity on your account. We may suspend an account that breaks these terms, sends prohibited items or leaves
          charges unpaid. You can close your account by writing to us once your goods have left and your balance is settled.
        </p>

        <H id="general">9. General</H>
        <p>
          We may update these terms. We will post the new date here and email you about important changes; continuing to use FoxPrep after a change means you accept it. These terms
          are governed by the laws of Ontario and the federal laws of Canada that apply there, and disputes go to the courts of Ontario.
        </p>
        <p>
          Questions: <Link href="/" className="font-semibold text-ink underline">foxprepcenter.com</Link>, or message us on WhatsApp from the website.
        </p>
      </main>
    </>
  );
}
