export const LOCALES = [
  { code: "en", name: "English", flag: "gb" },
  { code: "fr", name: "Français", flag: "fr" },
  { code: "es", name: "Español", flag: "es" },
  { code: "pt", name: "Português", flag: "pt" },
  { code: "it", name: "Italiano", flag: "it" },
  { code: "de", name: "Deutsch", flag: "de" },
  { code: "tr", name: "Türkçe", flag: "tr" },
  { code: "ru", name: "Русский", flag: "ru" },
  { code: "uk", name: "Українська", flag: "ua" },
  { code: "ar", name: "العربية", flag: "sa", dir: "rtl" },
  { code: "fa", name: "فارسی", flag: "ir", dir: "rtl" },
  { code: "hi", name: "हिन्दी", flag: "in" },
  { code: "pa", name: "ਪੰਜਾਬੀ", flag: "in" },
  { code: "zh", name: "简体中文", flag: "cn" },
  { code: "vi", name: "Tiếng Việt", flag: "vn" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "fp_lang";
export const isLocale = (v: unknown): v is Locale => LOCALES.some((l) => l.code === v);
export const dirOf = (l: Locale) => (LOCALES.find((x) => x.code === l) as { dir?: string } | undefined)?.dir === "rtl" ? "rtl" : "ltr";

/** Pick the best supported language from an Accept-Language header. */
export function negotiate(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const prefs = header
    .split(",")
    .map((p) => {
      const [tag, q] = p.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of prefs) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

export type Vars = Record<string, string | number>;
export function format(s: string, vars?: Vars) {
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s;
}
