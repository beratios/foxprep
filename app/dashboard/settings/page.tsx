"use client";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  useEffect(() => {
    // Not exposing a dedicated "me" endpoint yet — infer from a lightweight
    // orders fetch instead, or just leave null and let connect button work
    // idempotently either way.
    setConnected(false);
  }, []);

  async function connect() {
    setConnecting(true);
    const res = await fetch("/api/amazon/connect", { method: "POST" });
    setConnecting(false);
    if (res.ok) setConnected(true);
  }

  async function sync() {
    setSyncing(true);
    const res = await fetch("/api/amazon/sync", { method: "POST" });
    const data = await res.json();
    setSyncing(false);
    setSyncMsg(data.synced ? "Inventory synced." : data.reason || "Sync unavailable.");
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-bold mb-6">Settings</h1>

      <div className="card p-6">
        <div className="label mb-2">AMAZON INTEGRATION</div>
        <p className="text-sm text-[#c7cbd1] mb-4">
          Connect Seller Central to sync live stock and get automatic low-stock alerts. You can switch back to
          manual mode any time.
        </p>
        {connected ? (
          <>
            <div className="text-sm text-accent2 mb-3">✓ Connected</div>
            <button onClick={sync} disabled={syncing} className="btn-secondary">
              {syncing ? "Syncing…" : "Sync inventory now"}
            </button>
            {syncMsg && <p className="text-xs text-muted mt-2">{syncMsg}</p>}
          </>
        ) : (
          <button onClick={connect} disabled={connecting} className="btn-primary">
            {connecting ? "Connecting…" : "Connect Seller Central"}
          </button>
        )}
      </div>
    </div>
  );
}
