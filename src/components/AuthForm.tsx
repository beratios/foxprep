"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/i18n/client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { t } = useI18n();
  const sp = useSearchParams();
  const next = sp.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    // Check here first so messages appear in the visitor's language
    const problem =
      mode === "register" && (body.name || "").trim().length < 2
        ? t("auth.err.name", "Enter your name.")
        : !/^\S+@\S+\.\S+$/.test((body.email || "").trim())
          ? t("auth.err.email", "Enter a valid email.")
          : mode === "register" && (body.password || "").length < 8
            ? t("auth.err.password", "Use at least 8 characters for the password.")
            : mode === "register" && body.acceptTerms !== "yes"
              ? t("auth.err.terms", "Accept the Terms of Service to create an account.")
              : null;
    if (problem) {
      setError(problem);
      setBusy(false);
      return;
    }
    const res = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(
        res.status === 401
          ? t("auth.err.login", "Email or password is incorrect.")
          : res.status === 409
            ? t("auth.err.exists", "An account with this email already exists. Log in instead.")
            : json.error || t("auth.err.generic", "Something went wrong. Try again."),
      );
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
            <label className="label" htmlFor="name">{t("auth.name", "Your name")}</label>
            <input id="name" name="name" className="field" autoComplete="name" required />
          </div>
          <div>
            <label className="label" htmlFor="company">{t("auth.company", "Company")} <span className="font-normal text-ink-soft">({t("common.optional", "optional")})</span></label>
            <input id="company" name="company" className="field" autoComplete="organization" />
          </div>
        </div>
      )}
      <div>
        <label className="label" htmlFor="email">{t("auth.email", "Email")}</label>
        <input id="email" name="email" type="email" className="field" autoComplete="email" required />
      </div>
      {mode === "register" && (
        <div>
          <label className="label" htmlFor="phone">{t("auth.phone", "Phone")} <span className="font-normal text-ink-soft">({t("common.optional", "optional")})</span></label>
          <input id="phone" name="phone" type="tel" className="field" autoComplete="tel" />
        </div>
      )}
      <div>
        <label className="label" htmlFor="password">{t("auth.password", "Password")}</label>
        <input id="password" name="password" type="password" className="field" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required />
      </div>
      {mode === "register" && (
        <label className="flex items-start gap-3 text-sm leading-snug text-ink-2">
          <input type="checkbox" name="acceptTerms" value="yes" required className="mt-0.5 h-5 w-5 shrink-0 accent-[#E8590C]" />
          <span>
            {t("auth.terms.full", "I agree to the {tos} and won't send any {prohibited}. I am the importer of record for my goods.")
              .split(/(\{tos\}|\{prohibited\})/)
              .map((part, i) =>
                part === "{tos}" ? (
                  <Link key={i} href="/terms" target="_blank" className="font-semibold text-ink underline">{t("auth.terms.tos", "Terms of Service")}</Link>
                ) : part === "{prohibited}" ? (
                  <Link key={i} href="/terms#prohibited" target="_blank" className="font-semibold text-ink underline">{t("auth.terms.prohibited", "prohibited items")}</Link>
                ) : (
                  <span key={i}>{part}</span>
                ),
              )}
          </span>
        </label>
      )}
      {error && <p role="alert" className="rounded-md bg-fox-tint px-3 py-2 text-sm font-medium text-fox-dark">{error}</p>}
      <button className="btn-fox w-full" disabled={busy}>{busy ? t("common.wait", "One moment…") : mode === "login" ? t("nav.login", "Log in") : t("nav.register", "Create account")}</button>
      <p className="text-center text-sm text-ink-soft">
        {mode === "login" ? (
          <>{t("auth.new", "New to FoxPrep?")} <Link className="font-semibold text-ink underline" href={`/register${q}`}>{t("auth.createLink", "Create an account")}</Link></>
        ) : (
          <>{t("auth.have", "Already have an account?")} <Link className="font-semibold text-ink underline" href={`/login${q}`}>{t("nav.login", "Log in")}</Link></>
        )}
      </p>
    </form>
  );
}
