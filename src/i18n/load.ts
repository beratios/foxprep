import type { Locale } from "./config";

type Messages = Record<string, string>;

const loaders: Record<Locale, () => Promise<{ default: Messages }>> = {
  en: () => import("./messages/en.json"),
  fr: () => import("./messages/fr.json"),
  es: () => import("./messages/es.json"),
  pt: () => import("./messages/pt.json"),
  it: () => import("./messages/it.json"),
  de: () => import("./messages/de.json"),
  tr: () => import("./messages/tr.json"),
  ru: () => import("./messages/ru.json"),
  uk: () => import("./messages/uk.json"),
  ar: () => import("./messages/ar.json"),
  fa: () => import("./messages/fa.json"),
  hi: () => import("./messages/hi.json"),
  pa: () => import("./messages/pa.json"),
  zh: () => import("./messages/zh.json"),
  vi: () => import("./messages/vi.json"),
};

export async function loadMessages(locale: Locale): Promise<Messages> {
  // English text lives in the source as defaults, so "en" only needs overrides (usually none)
  try {
    return (await loaders[locale]()).default;
  } catch {
    return {};
  }
}
