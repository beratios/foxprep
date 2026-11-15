"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdjustBalance({ userId }: { userId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const res = await fetch(`/api/admin/users/${userId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount, description: reason }) });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) return setErr(j.error);
        setErr(null); setAmount(""); setReason("");
        router.refresh();
      }}
    >
      <input className="field tnum w-24 py-1.5" placeholder="+100" aria-label="Amount" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.-]/g, ""))} />
      <input className="field w-40 py-1.5" placeholder="Reason" aria-label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
      <button className="btn-ghost btn-sm" disabled={!amount || !reason}>Apply</button>
      {err && <span className="text-[13px] text-fox-dark">{err}</span>}
    </form>
  );
}
