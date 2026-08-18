"use client";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { COMPANY_NAME } from "@/lib/config";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }
    router.push("/login?reset=success");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card w-full max-w-sm p-8">
        <div className="font-display font-bold text-lg mb-1">{COMPANY_NAME}</div>
        <h1 className="font-display text-xl font-bold mb-6">Set a new password</h1>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">New password</label>
            <input className="input mt-1" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>{loading ? "Saving…" : "Reset password"}</button>
        </form>
      </div>
    </div>
  );
}
