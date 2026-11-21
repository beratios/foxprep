"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_COOKIE } from "@/i18n/config";
import { useI18n } from "@/i18n/client";

function Flag({ code }: { code: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/flags/${code}.svg`} alt="" width={20} height={15} className="h-[15px] w-5 shrink-0 rounded-[2px] object-cover ring-1 ring-black/10" />;
}

export function LanguageSwitcher({ compact = false, up = false }: { compact?: boolean; up?: boolean }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  function choose(code: string) {
    document.cookie = `${LOCALE_COOKIE}=${code}; path=/; max-age=31536000; samesite=lax`;
    setOpen(false);
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("lang.choose", "Choose language")}
        className="flex items-center gap-2 rounded-md border border-line bg-white px-2.5 py-2 text-sm font-semibold text-ink hover:border-ink/40"
      >
        <Flag code={current.flag} />
        {!compact && <span>{current.name}</span>}
        <span aria-hidden className="text-xs text-ink-soft">▾</span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={t("lang.choose", "Choose language")}
          className={`absolute z-50 max-h-[70vh] w-56 overflow-auto rounded-lg border border-line bg-white py-1 shadow-lg ${up ? "bottom-full mb-2" : "mt-2"} end-0`}
        >
          {LOCALES.map((l) => (
            <li key={l.code} role="option" aria-selected={l.code === locale}>
              <button
                type="button"
                lang={l.code}
                onClick={() => choose(l.code)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-start text-[15px] hover:bg-paper ${l.code === locale ? "font-bold text-fox-dark" : "text-ink"}`}
              >
                <Flag code={l.flag} />
                <span>{l.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
