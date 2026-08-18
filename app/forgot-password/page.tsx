"use client";
import { useState } from "react";
import Link from "next/link";
import { COMPANY_NAME } from "@/lib/config";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card w-full max-w-sm p-8">
        <div className="font-display font-bold text-lg mb-1">{COMPANY_NAME}</div>
        <h1 className="font-display text-xl font-bold mb-1">Reset your password</h1>
        {sent ? (
          <p className="text-muted text-sm mt-4">
            If an account exists for that email, we've sent a reset link. Check your inbox.
          </p>
        ) : (
          <>
            <p className="text-muted text-sm mb-6">We'll email you a link to reset your password.</p>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input className="input mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <button className="btn-primary w-full" disabled={loading}>{loading ? "Sending…" : "Send reset link"}</button>
            </form>
          </>
        )}
        <p className="text-muted text-xs mt-5 text-center">
          <Link href="/login" className="text-accent">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
