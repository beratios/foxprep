"use client";
import { useEffect, useState } from "react";

type Customer = {
  id: string; name: string; email: string; amazonConnected: boolean;
  shipmentCount: number; balance: number; createdAt: string;
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [adjustFor, setAdjustFor] = useState<string | null>(null);
  const [amount, setAmount] = useState(0);
  const [desc, setDesc] = useState("");

  async function load() {
    const res = await fetch("/api/admin/customers");
    const data = await res.json();
    setCustomers(data.customers ?? []);
  }
  useEffect(() => { load(); }, []);

  async function submitAdjustment(id: string) {
    await fetch(`/api/admin/customers/${id}/adjust`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, description: desc }),
    });
    setAdjustFor(null); setAmount(0); setDesc("");
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Customers</h1>
      <div className="card divide-y divide-border">
        {customers.map((c) => (
          <div key={c.id} className="p-4 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-muted">{c.email} · {c.shipmentCount} shipments {c.amazonConnected && "· Amazon connected"}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-accent">${c.balance.toFixed(2)}</div>
                <button onClick={() => setAdjustFor(adjustFor === c.id ? null : c.id)} className="text-xs text-accent2">
                  Adjust balance
                </button>
              </div>
            </div>
            {adjustFor === c.id && (
              <div className="mt-3 flex gap-2 items-end">
                <div>
                  <label className="label block mb-1">Amount</label>
                  <input type="number" className="input w-28" value={amount} onChange={(e) => setAmount(+e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="label block mb-1">Reason</label>
                  <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. refund for delay" />
                </div>
                <button onClick={() => submitAdjustment(c.id)} className="btn-primary">Apply</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
