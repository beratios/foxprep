"use client";
import { useEffect, useState } from "react";

type Tx = { id: string; type: string; amount: number; description: string; createdAt: string };

export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/wallet");
    const data = await res.json();
    setBalance(data.balance ?? 0);
    setTxs(data.transactions ?? []);
  }

  useEffect(() => { load(); }, []);

  async function topUpStripe() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/wallet/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCad: amount }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Stripe is not configured yet — use the demo top-up below for now.");
      return;
    }
    window.location.href = data.url;
  }

  async function topUpDemo() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/wallet/demo-topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCad: amount }),
    });
    setLoading(false);
    if (res.ok) load();
    else setError("Demo top-up failed.");
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-bold mb-6">Wallet</h1>

      <div className="card p-6 mb-6">
        <div className="label mb-2">BALANCE</div>
        <div className="font-display text-4xl font-bold text-accent mb-5">
          {balance === null ? "…" : `$${balance.toFixed(2)}`} CAD
        </div>

        <label className="label mb-2 block">Top up amount (CAD)</label>
        <input type="number" min={10} className="input mb-3" value={amount} onChange={(e) => setAmount(+e.target.value)} />
        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={topUpStripe} disabled={loading} className="btn-primary flex-1">Pay with card (Stripe)</button>
          <button onClick={topUpDemo} disabled={loading} className="btn-secondary flex-1">Demo top-up (test)</button>
        </div>
        <p className="text-xs text-muted mt-3">
          Card payments go live once Stripe keys are added. Use "Demo top-up" to test the order flow in the meantime.
        </p>
      </div>

      <h2 className="font-display text-lg font-bold mb-3">Transaction history</h2>
      <div className="card divide-y divide-border">
        {txs.length === 0 && <div className="p-5 text-sm text-muted">No transactions yet.</div>}
        {txs.map((t) => (
          <div key={t.id} className="flex items-center justify-between p-4 text-sm">
            <div>
              <div className="font-medium">{t.description}</div>
              <div className="text-xs text-muted">{new Date(t.createdAt).toLocaleString()}</div>
            </div>
            <div className={`font-semibold ${t.amount >= 0 ? "text-green-400" : "text-red-400"}`}>
              {t.amount >= 0 ? "+" : ""}{t.amount.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
