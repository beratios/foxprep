"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/client";

const PRESETS = [100, 250, 500, 1000];

export function TopUpForm({ enabled }: { enabled: boolean }) {
  const { t } = useI18n();
  const [amount, setAmount] = useState("250");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!enabled) return <p className="mt-2 text-sm text-ink-soft">{t("components_topupform.card_top_ups_turn_on_once_stripe_keys_ar", "Card top-ups turn on once Stripe keys are added. Until then, we can add funds for you after an e-Transfer.")}</p>;
  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const res = await fetch("/api/wallet/topup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: Number(amount) }) });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.url) return void (window.location.href = json.url);
        setBusy(false);
        setError(json.error || t("topup.err", "Could not start the payment."));
      }}
    >
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map((p) => (
          <button type="button" key={p} onClick={() => setAmount(String(p))} className={`tnum rounded-md border-2 py-2 text-sm font-bold ${amount === String(p) ? "border-ink bg-ink text-white" : "border-line"}`}>${p}</button>
        ))}
      </div>
      <div>
        <label htmlFor="amt" className="label">{t("components_topupform.amount_cad", "Amount (CAD)")}</label>
        <input id="amt" className="field tnum text-lg font-bold" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} />
      </div>
      {error && <p role="alert" className="text-sm font-medium text-fox-dark">{error}</p>}
      <button className="btn-fox w-full" disabled={busy || !Number(amount)}>{busy ? t("topup.opening", "Opening checkout…") : t("topup.add", "Add ${amount} by card", { amount: Number(amount || 0).toLocaleString() })}</button>
    </form>
  );
}
