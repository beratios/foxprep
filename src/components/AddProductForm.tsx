"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";

export function AddProductForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [f, setF] = useState({ title: "", sku: "", fnsku: "", asin: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="grid gap-2 rounded-lg border border-dashed border-line p-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const res = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
        const json = await res.json().catch(() => ({}));
        setBusy(false);
        if (!res.ok) return setError(json.error);
        setError(null);
        setF({ title: "", sku: "", fnsku: "", asin: "" });
        router.refresh();
      }}
    >
      {(["title", "sku", "fnsku", "asin"] as const).map((k) => (
        <input key={k} aria-label={k} className="field" placeholder={{ title: t("products.namePh", "Product name"), sku: "SKU", fnsku: t("products.fnskuPh", "FNSKU (optional)"), asin: t("products.asinPh", "ASIN (optional)") }[k]} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
      ))}
      <button className="btn-ink btn-sm" disabled={busy || !f.title || !f.sku}>{t("components_addproductform.add_product", "Add product")}</button>
      {error && <p role="alert" className="text-sm text-fox-dark md:col-span-5">{error}</p>}
    </form>
  );
}
