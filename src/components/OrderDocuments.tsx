"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";

type Kind = "UNIT_LABELS" | "BOX_LABELS" | "CARRIER_LABELS" | "SHIPPING_LABELS" | "OTHER";
type Channel = "FBA" | "WFS" | "FBM";
export type Doc = { id: string; kind: Kind; name: string; url: string; size: number; fromAdmin: boolean; createdAt: string };

const KINDS_BY_CHANNEL: Record<Channel, Kind[]> = {
  FBA: ["UNIT_LABELS", "BOX_LABELS", "CARRIER_LABELS", "OTHER"],
  WFS: ["UNIT_LABELS", "BOX_LABELS", "CARRIER_LABELS", "OTHER"],
  FBM: ["SHIPPING_LABELS", "OTHER"],
};

const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** What we need from the customer for this channel, plus their uploaded label files. */
export function OrderDocuments({
  orderId,
  channel,
  status,
  boxInfo,
  docs,
  admin = false,
}: {
  orderId: string;
  channel: Channel;
  status: string;
  boxInfo: string | null;
  docs: Doc[];
  admin?: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const kinds = KINDS_BY_CHANNEL[channel];
  const [kind, setKind] = useState<Kind>(channel === "FBM" ? "SHIPPING_LABELS" : status === "AWAITING_LABELS" ? "BOX_LABELS" : "UNIT_LABELS");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = ["SHIPPED", "COMPLETED"].includes(status);

  const kindLabel = (k: Kind) =>
    ({
      UNIT_LABELS: channel === "WFS" ? t("docs.kind.unitWfs", "Item labels") : t("docs.kind.unit", "Unit labels (FNSKU)"),
      BOX_LABELS: channel === "WFS" ? t("docs.kind.cartonWfs", "Carton labels") : t("docs.kind.box", "Box labels"),
      CARRIER_LABELS: t("docs.kind.carrier", "Carrier labels or bill of lading"),
      SHIPPING_LABELS: t("docs.kind.shipping", "Shipping labels"),
      OTHER: t("docs.kind.other", "Other"),
    })[k];

  const needs: { title: string; body: string }[] =
    channel === "FBA"
      ? [
          { title: t("docs.kind.unit", "Unit labels (FNSKU)"), body: t("docs.fba.unit", "We print these from the FNSKU you entered for each product. If a product has no FNSKU, upload the label PDF from Seller Central.") },
          { title: t("docs.kind.box", "Box labels"), body: t("docs.fba.box", "When prep is done we post the box count, sizes and weights on this page. Create the shipment in Send to Amazon with them, then upload the box labels PDF here.") },
          { title: t("docs.kind.carrier", "Carrier labels or bill of lading"), body: t("docs.fba.carrier", "Using Amazon's partnered carrier? Upload the UPS labels, or the bill of lading for pallets. If you book your own carrier, tell us in a support message.") },
        ]
      : channel === "WFS"
        ? [
            { title: t("docs.kind.unitWfs", "Item labels"), body: t("docs.wfs.unit", "We print these from the barcode on your products. If Walmart asks for a different item label, upload the PDF.") },
            { title: t("docs.kind.cartonWfs", "Carton labels"), body: t("docs.wfs.box", "When prep is done we post the box count, sizes and weights on this page. Create the inbound order in Seller Center with them, then upload the carton labels here.") },
            { title: t("docs.kind.carrier", "Carrier labels or bill of lading"), body: t("docs.wfs.carrier", "Upload the carrier labels or bill of lading from your Walmart inbound order.") },
          ]
        : [
            { title: t("docs.kind.shipping", "Shipping labels"), body: t("docs.fbm.label", "For each customer order, buy postage and upload the shipping label PDF here. Put the order number in the file name so we pack the right items.") },
            { title: t("docs.fbm.slipT", "Packing slip"), body: t("docs.fbm.slip", "Optional. Upload one if you want it in the box.") },
          ];

  async function upload() {
    const files = Array.from(fileRef.current?.files ?? []);
    if (!files.length) return setError(t("docs.err.choose", "Choose a file first."));
    setBusy(true);
    setError(null);
    for (const f of files) {
      const fd = new FormData();
      fd.set("kind", kind);
      fd.set("file", f);
      const res = await fetch(`/api/orders/${orderId}/documents`, { method: "POST", body: fd });
      if (!res.ok) {
        const code = res.status;
        setError(
          code === 415
            ? t("docs.err.type", "{name}: only PDF, PNG or JPG files.", { name: f.name })
            : code === 413
              ? t("docs.err.size", "{name} is larger than 4 MB. Split the PDF into smaller files.", { name: f.name })
              : t("auth.err.generic", "Something went wrong. Try again."),
        );
        break;
      }
    }
    if (fileRef.current) fileRef.current.value = "";
    setBusy(false);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm(t("docs.confirmDelete", "Delete this file?"))) return;
    await fetch(`/api/orders/${orderId}/documents?docId=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <section className={admin ? "panel p-5" : ""}>
      <h2 className="mb-3 text-lg font-bold">{t("docs.title", "Labels and files")}</h2>

      {!admin && status === "AWAITING_LABELS" && (
        <div role="status" className="mb-4 rounded-lg border-2 border-fox bg-fox-tint/40 p-4 text-[14.5px]">
          <p className="font-bold">{t("docs.waiting", "Your shipment is packed and waiting for labels.")}</p>
          <p className="mt-1 text-ink-2">{t("docs.waitingSub", "Upload them below and we ship within one business day.")}</p>
        </div>
      )}

      {!admin && boxInfo && (
        <div className="mb-4 rounded-lg border-2 border-ink bg-white p-4">
          <div className="mb-1 text-[13px] font-bold">{t("docs.boxInfo", "Box details for your shipment plan")}</div>
          <pre dir="ltr" className="whitespace-pre-wrap font-mono text-[13.5px] leading-relaxed">{boxInfo}</pre>
        </div>
      )}

      {!admin && (
        <details className="panel mb-4 p-4" open={!docs.length}>
          <summary className="cursor-pointer text-[14.5px] font-semibold">{t("docs.needTitle", "What we need from you")}</summary>
          <ol className="mt-3 space-y-3">
            {needs.map((n, i) => (
              <li key={n.title} className="flex gap-3 text-[14px]">
                <span className="tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-white">{i + 1}</span>
                <span>
                  <span className="block font-semibold">{n.title}</span>
                  <span className="text-ink-2">{n.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </details>
      )}

      {docs.length > 0 && (
        <ul className="panel mb-4 divide-y divide-line">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-3 px-4 py-2.5 text-[14px]">
              <span aria-hidden className="rounded bg-paper px-1.5 py-0.5 text-[11px] font-bold text-ink-soft">{d.name.toLowerCase().endsWith(".pdf") ? "PDF" : "IMG"}</span>
              <span className="min-w-0 flex-1">
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="block truncate font-semibold underline-offset-2 hover:underline">{d.name}</a>
                <span className="tnum text-[12.5px] text-ink-soft">
                  {kindLabel(d.kind)} · {kb(d.size)} · {new Date(d.createdAt).toLocaleDateString("en-CA")}
                  {d.fromAdmin && <> · {t("docs.fromUs", "from FoxPrep")}</>}
                </span>
              </span>
              <a href={d.url} download className="btn-ghost btn-sm shrink-0">{t("docs.download", "Download")}</a>
              {(admin || (!d.fromAdmin && !locked)) && (
                <button type="button" onClick={() => remove(d.id)} className="shrink-0 text-[13px] font-semibold text-fox-dark hover:underline">
                  {t("docs.delete", "Delete")}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {(admin || !locked) && (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label" htmlFor={`dk-${orderId}`}>{t("docs.type", "File type")}</label>
            <select id={`dk-${orderId}`} className="field" value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
              {kinds.map((k) => <option key={k} value={k}>{kindLabel(k)}</option>)}
            </select>
          </div>
          <div className="min-w-0 flex-1">
            <label className="label" htmlFor={`df-${orderId}`}>{t("docs.files", "PDF, PNG or JPG, up to 4 MB each")}</label>
            <input id={`df-${orderId}`} ref={fileRef} type="file" multiple accept="application/pdf,image/png,image/jpeg,image/webp" className="field py-1.5 text-[14px]" />
          </div>
          <button type="button" onClick={upload} disabled={busy} className="btn-fox">
            {busy ? t("docs.uploading", "Uploading…") : t("docs.upload", "Upload")}
          </button>
        </div>
      )}
      {error && <p role="alert" className="mt-3 rounded-md bg-fox-tint px-3 py-2 text-sm font-medium text-fox-dark">{error}</p>}
    </section>
  );
}
