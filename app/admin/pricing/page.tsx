"use client";
import { useEffect, useState } from "react";

const FIELDS: { key: string; label: string; suffix: string }[] = [
  { key: "silverRateUnit", label: "Silver — rolling volume 1–999 units/30d", suffix: "/unit" },
  { key: "platinumRateUnit", label: "Platinum — rolling volume 1,000–4,999 units/30d", suffix: "/unit" },
  { key: "diamondRateUnit", label: "Diamond — rolling volume 5,000+ units/30d", suffix: "/unit" },
  { key: "polyRate", label: "Poly-bagging", suffix: "/unit" },
  { key: "bundleRate", label: "Bundling", suffix: "/set" },
  { key: "insertRate", label: "Custom insert", suffix: "/insert" },
  { key: "storageRatePerBoxMonth", label: "Storage past 5 days", suffix: "/box/month" },
  { key: "hstRate", label: "HST (Ontario)", suffix: "as decimal, e.g. 0.13" },
];

export default function AdminPricingPage() {
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/pricing").then((r) => r.json()).then((d) => setRates(d.settings));
  }, []);

  async function save() {
    if (!rates) return;
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/pricing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rates),
    });
    setSaving(false);
    setSaved(true);
  }

  if (!rates) return <div className="text-muted text-sm">Loading…</div>;

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-bold mb-1">Pricing</h1>
      <p className="text-muted text-sm mb-6">
        Rates are one-time, per-shipment charges. Tier is decided by each customer's rolling 30-day shipped
        volume — not the size of a single shipment. Only storage past 5 days recurs monthly, and only when you
        run it from the Billing page.
      </p>
      <div className="card p-6 space-y-4">
        {FIELDS.map((f) => (
          <div key={f.key} className="flex items-center justify-between gap-4">
            <label className="text-sm">{f.label}</label>
            <div className="flex items-center gap-2">
              {f.key !== "hstRate" && <span className="text-muted text-sm">$</span>}
              <input
                type="number"
                step="0.01"
                className="input w-24"
                value={rates[f.key] ?? 0}
                onChange={(e) => setRates({ ...rates, [f.key]: +e.target.value })}
              />
              <span className="text-muted text-xs">{f.suffix}</span>
            </div>
          </div>
        ))}
        <button onClick={save} disabled={saving} className="btn-primary mt-2">{saving ? "Saving…" : "Save pricing"}</button>
        {saved && <p className="text-xs text-accent2">Saved — new rates apply to shipments created from now on. Past invoices are unaffected (each shipment snapshots its own rate).</p>}
      </div>
    </div>
  );
}
