import { warehouse, attentionLine } from "@/lib/warehouse";
import { CopyButton } from "./CopyButton";
import { getI18n } from "@/i18n/server";

export async function AddressCard({ customerCode, orderRef, name, hasCompany = true }: { customerCode: string; orderRef?: string; name: string; hasCompany?: boolean }) {
  const w = warehouse();
  const { t } = await getI18n();
  const attn = orderRef ? attentionLine(customerCode, orderRef) : `ATTN: ${customerCode}`;
  const consignee = `${name} c/o ${w.name}`;
  const text = [consignee, attn, w.street, `${w.city}, ${w.province} ${w.postal}`, w.country, w.phone].join("\n");
  // Kept in English on purpose: this is pasted to the supplier, not read by the customer
  const supplierMsg = [
    "Hello, please ship this order to our prep center:",
    "",
    text,
    "",
    "Please make sure:",
    `1. The first line reads exactly "${consignee}". FoxPrep is only the receiving address, not the buyer or importer.`,
    `2. "${attn}" is printed on every carton and on the bill of lading.`,
    `3. The commercial invoice and customs papers name ${name} as the importer and consignee.`,
    "Thank you.",
  ].join("\n");
  return (
    <div className="thermal rounded-[3px] border-[3px] border-black p-4 text-black">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold">{t("label.shipTo", "SHIP TO")}</div>
          <div className="text-[12px] leading-snug">{t("addr.giveSupplier", "Give this address to your supplier exactly as written.")}</div>
        </div>
        <CopyButton text={text} label={t("addr.copy", "Copy address")} doneLabel={t("addr.copied", "Copied")} />
      </div>
      <address dir="ltr" className="mt-1 text-start not-italic leading-snug">
        <div className="wide -mx-1 rounded-[3px] border-2 border-dashed border-black px-1 text-lg font-extrabold">{consignee}</div>
        <div className="tnum my-1 inline-block bg-black px-2 py-0.5 text-[15px] font-bold text-white">{attn}</div>
        <div>{w.street}</div>
        <div>{w.city}, {w.province} {w.postal}</div>
        <div>{w.country}</div>
        <div className="tnum">{w.phone}</div>
      </address>
      <p className="mt-3 border-t-2 border-black pt-2 text-[12.5px] font-semibold leading-snug">
        {t("addr.coNote", "The first line must read \"{line}\". The c/o means your goods are delivered to FoxPrep on your behalf; FoxPrep is not the buyer or the importer.", { line: consignee })}
      </p>
      <p className="mt-2 text-[12.5px] leading-snug">
        {t("addr.attnNote", "Your supplier must print the ATTN line on every carton and on the bill of lading. Cartons without it take longer to match.")}
      </p>
      <p className="mt-2 text-[12.5px] leading-snug">
        {t("addr.importer", "You are the importer of record. Your name or company goes on the commercial invoice and customs paperwork, and duties and taxes are billed to you, not to FoxPrep.")}
      </p>
      <div className="mt-3 border-t-2 border-black pt-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="text-[11px] font-bold">{t("addr.msgTitle", "MESSAGE FOR YOUR SUPPLIER")}</div>
          <CopyButton text={supplierMsg} label={t("addr.copyMsg", "Copy message")} doneLabel={t("addr.copied", "Copied")} />
        </div>
        <pre dir="ltr" lang="en" className="max-h-40 overflow-auto whitespace-pre-wrap rounded-[3px] bg-black/5 p-2 text-start font-mono text-[11.5px] leading-snug">{supplierMsg}</pre>
        <p className="mt-1 text-[11.5px] text-black/70">{t("addr.msgNote", "In English, ready to paste into email, WeChat or Alibaba chat.")}</p>
      </div>
      {!hasCompany && (
        <p className="mt-3 rounded-[3px] border-2 border-red-600 bg-red-50 px-2 py-1.5 text-[13px] font-semibold text-red-700">
          {t("addr.addCompany", "Add your company name for customs paperwork.")}{" "}
          <a href="/dashboard/account" className="underline">{t("addr.goSettings", "Go to account settings")}</a>
        </p>
      )}
    </div>
  );
}
