"use client";
import { useState } from "react";

export default function AdminBillingPage() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function runStorageBilling() {
    setRunning(true);
    const res = await fetch("/api/admin/billing/storage", { method: "POST" });
    const data = await res.json();
    setRunning(false);
    setResult(data);
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-bold mb-1">Billing</h1>
      <p className="text-muted text-sm mb-6">
        Prep and shipping charges happen automatically per shipment. Storage past the free 5-day window does
        not — run it here, on whatever schedule you like (e.g. once a month).
      </p>

      <div className="card p-6">
        <div className="label mb-2">STORAGE BILLING</div>
        <p className="text-sm text-[#c7cbd1] mb-4">
          Charges every customer's wallet for inventory that's been sitting past 5 days and hasn't been billed
          for this period yet.
        </p>
        <button onClick={runStorageBilling} disabled={running} className="btn-primary">
          {running ? "Running…" : "Run storage billing now"}
        </button>

        {result && (
          <div className="mt-5 text-sm">
            <p className="mb-2">
              Charged <strong>{result.itemsCharged}</strong> inventory lines, total{" "}
              <strong className="text-accent">${result.totalCharged?.toFixed(2)}</strong>.
            </p>
            {result.results?.length > 0 && (
              <div className="divide-y divide-border border border-border rounded-lg mt-3">
                {result.results.map((r: any, i: number) => (
                  <div key={i} className="flex justify-between p-2.5 text-xs">
                    <span>{r.user} — {r.product}</span>
                    <span>${r.fee.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
