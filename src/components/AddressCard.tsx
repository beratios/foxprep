import { warehouse, attentionLine } from "@/lib/warehouse";
import { CopyButton } from "./CopyButton";

export function AddressCard({ customerCode, orderRef, name }: { customerCode: string; orderRef?: string; name: string }) {
  const w = warehouse();
  const attn = orderRef ? attentionLine(customerCode, orderRef) : `ATTN: ${customerCode}`;
  const text = [`${w.name} — ${name}`, attn, w.street, `${w.city}, ${w.province} ${w.postal}`, w.country, w.phone].join("\n");
  return (
    <div className="thermal rounded-[3px] border-[3px] border-black p-4 text-black">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-bold">SHIP TO</div>
        <CopyButton text={text} />
      </div>
      <address className="mt-1 not-italic leading-snug">
        <div className="wide text-lg font-extrabold">{w.name} — {name}</div>
        <div className="tnum my-1 inline-block bg-black px-2 py-0.5 text-[15px] font-bold text-white">{attn}</div>
        <div>{w.street}</div>
        <div>{w.city}, {w.province} {w.postal}</div>
        <div>{w.country}</div>
        <div className="tnum">{w.phone}</div>
      </address>
      <p className="mt-3 border-t-2 border-black pt-2 text-[12.5px] leading-snug">
        Your supplier must print the ATTN line on every carton and on the bill of lading. Cartons without it take longer to match.
      </p>
    </div>
  );
}
