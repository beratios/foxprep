"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error || "Something went wrong. Try again.");
      setBusy(false);
      return;
    }
    router.push(safeNext || (json.role === "ADMIN" ? "/admin" : "/dashboard"));
    router.refresh();
  }

  const q = safeNext ? `?next=${encodeURIComponent(safeNext)}` : "";
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {mode === "register" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">Your name</label>
            <input id="name" name="name" className="field" autoComplete="name" required />
          </div>
          <div>
            <label className="label" htmlFor="company">Company <span className="font-normal text-ink-soft">(optional)</span></label>
            <input id="company" name="company" className="field" autoComplete="organization" />
          </div>
        </div>
      )}
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="field" autoComplete="email" required />
      </div>
      {mode === "register" && (
        <div>
          <label className="label" htmlFor="phone">Phone <span className="font-normal text-ink-soft">(optional)</span></label>
          <input id="phone" name="phone" type="tel" className="field" autoComplete="tel" />
        </div>
      )}
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="field" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required />
      </div>
      {error && <p role="alert" className="rounded-md bg-fox-tint px-3 py-2 text-sm font-medium text-fox-dark">{error}</p>}
      <button className="btn-fox w-full" disabled={busy}>{busy ? "One moment…" : mode === "login" ? "Log in" : "Create account"}</button>
      <p className="text-center text-sm text-ink-soft">
        {mode === "login" ? (
          <>New to FoxPrep? <Link className="font-semibold text-ink underline" href={`/register${q}`}>Create an account</Link></>
        ) : (
          <>Already have an account? <Link className="font-semibold text-ink underline" href={`/login${q}`}>Log in</Link></>
        )}
      </p>
    </form>
  );
}
