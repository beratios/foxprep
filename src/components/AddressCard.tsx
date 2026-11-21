import { warehouse, attentionLine } from "@/lib/warehouse";
import { CopyButton } from "./CopyButton";
import { getI18n } from "@/i18n/server";

export async function AddressCard({ customerCode, orderRef, name, hasCompany = true }: { customerCode: string; orderRef?: string; name: string; hasCompany?: boolean }) {
  const w = warehouse();
  const { t } = await getI18n();
  const attn = orderRef ? attentionLine(customerCode, orderRef) : `ATTN: ${customerCode}`;
  const text = [`${name} c/o ${w.name}`, attn, w.street, `${w.city}, ${w.province} ${w.postal}`, w.country, w.phone].join("\n");
  return (
    <div className="thermal rounded-[3px] border-[3px] border-black p-4 text-black">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-bold">{t("label.shipTo", "SHIP TO")}</div>
        <CopyButton text={text} label={t("addr.copy", "Copy address")} doneLabel={t("addr.copied", "Copied")} />
      </div>
      <address dir="ltr" className="mt-1 text-start not-italic leading-snug">
        <div className="wide text-lg font-extrabold">{name} c/o {w.name}</div>
        <div className="tnum my-1 inline-block bg-black px-2 py-0.5 text-[15px] font-bold text-white">{attn}</div>
        <div>{w.street}</div>
        <div>{w.city}, {w.province} {w.postal}</div>
        <div>{w.country}</div>
        <div className="tnum">{w.phone}</div>
      </address>
      <p className="mt-3 border-t-2 border-black pt-2 text-[12.5px] leading-snug">
        {t("addr.attnNote", "Your supplier must print the ATTN line on every carton and on the bill of lading. Cartons without it take longer to match.")}
      </p>
      <p className="mt-2 text-[12.5px] leading-snug">
        {t("addr.importer", "You are the importer of record. Your name or company goes on the commercial invoice and customs paperwork, and duties and taxes are billed to you, not to FoxPrep.")}
      </p>
      {!hasCompany && (
        <p className="mt-3 rounded-[3px] border-2 border-red-600 bg-red-50 px-2 py-1.5 text-[13px] font-semibold text-red-700">
          {t("addr.addCompany", "Add your company name for customs paperwork.")}{" "}
          <a href="/dashboard/account" className="underline">{t("addr.goSettings", "Go to account settings")}</a>
        </p>
      )}
    </div>
  );
}
