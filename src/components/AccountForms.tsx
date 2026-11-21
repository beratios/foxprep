"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AccountForms({ user }: { user: { name: string; company: string; phone: string } }) {
  const router = useRouter();
  const [p, setP] = useState(user);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pw, setPw] = useState({ current: "", next: "" });
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<"profile" | "pw" | null>(null);

  return (
    <div className="mt-8 space-y-8">
      <form
        className="panel space-y-4 p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy("profile");
          const res = await fetch("/api/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });
          const j = await res.json().catch(() => ({}));
          setBusy(null);
          setMsg(res.ok ? { ok: true, text: "Saved." } : { ok: false, text: j.error || "Couldn't save." });
          if (res.ok) router.refresh();
        }}
      >
        <h2 className="text-lg font-bold">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="a-name">Your name</label>
            <input id="a-name" className="field" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} autoComplete="name" />
          </div>
          <div>
            <label className="label" htmlFor="a-phone">Phone</label>
            <input id="a-phone" className="field" value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} autoComplete="tel" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="a-company">Company name</label>
          <input id="a-company" className="field" value={p.company} onChange={(e) => setP({ ...p, company: e.target.value })} autoComplete="organization" placeholder="As it appears on your customs paperwork" />
          <p className="mt-1.5 text-[13px] text-ink-soft">Printed on your shipping address as &quot;Company c/o FoxPrep&quot;. Use the name your supplier puts on the commercial invoice.</p>
        </div>
        {msg && <p role="status" className={`text-sm font-semibold ${msg.ok ? "text-ok" : "text-red-600"}`}>{msg.text}</p>}
        <button className="btn-ink" disabled={busy === "profile"}>{busy === "profile" ? "Saving…" : "Save profile"}</button>
      </form>

      <form
        className="panel space-y-4 p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy("pw");
          const res = await fetch("/api/account/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pw) });
          const j = await res.json().catch(() => ({}));
          setBusy(null);
          setPwMsg(res.ok ? { ok: true, text: "Password changed." } : { ok: false, text: j.error || "Couldn't change the password." });
          if (res.ok) setPw({ current: "", next: "" });
        }}
      >
        <h2 className="text-lg font-bold">Password</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="a-cur">Current password</label>
            <input id="a-cur" type="password" className="field" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" />
          </div>
          <div>
            <label className="label" htmlFor="a-new">New password</label>
            <input id="a-new" type="password" className="field" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" minLength={8} />
          </div>
        </div>
        {pwMsg && <p role="status" className={`text-sm font-semibold ${pwMsg.ok ? "text-ok" : "text-red-600"}`}>{pwMsg.text}</p>}
        <button className="btn-ghost" disabled={busy === "pw"}>{busy === "pw" ? "Saving…" : "Change password"}</button>
      </form>
    </div>
  );
}
