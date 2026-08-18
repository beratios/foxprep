"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { COMPANY_NAME } from "@/lib/config";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }
    const next = params.get("next");
    router.push(next || (data.role === "ADMIN" ? "/admin" : "/dashboard"));
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card w-full max-w-sm p-8">
        <div className="font-display font-bold text-lg mb-1">{COMPANY_NAME}</div>
        <h1 className="font-display text-xl font-bold mb-1">Log in to your account</h1>
        <p className="text-muted text-sm mb-6">Manage your orders, balance, and shipments from one panel.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Email address</label>
            <input className="input mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="label">Password</label>
              <Link href="/forgot-password" className="text-xs text-accent2">Forgot password?</Link>
            </div>
            <input className="input mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>
        <p className="text-muted text-xs mt-5 text-center">
          Don't have an account? <Link href="/register" className="text-accent">Register</Link>
        </p>
      </div>
    </div>
  );
}
