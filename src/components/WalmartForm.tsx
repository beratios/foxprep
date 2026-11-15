"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WalmartForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      className="mt-5 space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        const body = Object.fromEntries(new FormData(e.currentTarget));
        const res = await fetch("/api/integrations/walmart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const json = await res.json().catch(() => ({}));
        setBusy(false);
        setMsg(res.ok ? { ok: true, text: `Connected. ${json.count ?? 0} products imported.` } : { ok: false, text: json.error || "Couldn't connect." });
        if (res.ok) router.refresh();
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        {(["US", "CA"] as const).map((r) => (
          <label key={r} className="flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold has-[:checked]:border-ink">
            <input type="radio" name="region" value={r} defaultChecked={r === "US"} className="accent-[#E8590C]" /> Walmart {r === "US" ? ".com" : ".ca"}
          </label>
        ))}
      </div>
      <input name="clientId" className="field" placeholder="Client ID" aria-label="Walmart Client ID" required autoComplete="off" />
      <input name="clientSecret" type="password" className="field" placeholder="Client Secret" aria-label="Walmart Client Secret" required autoComplete="off" />
      <input name="storeName" className="field" placeholder="Store name (optional)" aria-label="Store name" />
      {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm font-medium ${msg.ok ? "text-ok" : "text-fox-dark"}`}>{msg.text}</p>}
      <button className="btn-ink btn-sm" disabled={busy}>{busy ? "Checking keys…" : "Connect Walmart"}</button>
    </form>
  );
}
