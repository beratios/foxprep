"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";

/** POSTs (or DELETEs) JSON, then follows a returned url or refreshes the page. */
export function ActionButton({
  endpoint,
  body,
  method = "POST",
  confirm,
  className = "btn-ghost btn-sm",
  children,
}: {
  endpoint: string;
  body?: unknown;
  method?: "POST" | "DELETE";
  confirm?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        className={className}
        disabled={busy}
        onClick={async () => {
          if (confirm && !window.confirm(confirm)) return;
          setBusy(true);
          setError(null);
          const res = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
          const json = await res.json().catch(() => ({}));
          setBusy(false);
          if (!res.ok) return setError(json.error || t("common.failed", "That didn't work. Try again."));
          if (json.url) window.location.href = json.url;
          else router.refresh();
        }}
      >
        {busy ? t("common.working", "Working…") : children}
      </button>
      {error && <span role="alert" className="text-[13px] font-medium text-fox-dark">{error}</span>}
    </span>
  );
}
