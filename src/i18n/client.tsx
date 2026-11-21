"use client";

import { createContext, useContext } from "react";
import { format, type Locale, type Vars } from "./config";

const Ctx = createContext<{ locale: Locale; messages: Record<string, string> }>({ locale: "en", messages: {} });

export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: Record<string, string>; children: React.ReactNode }) {
  return <Ctx.Provider value={{ locale, messages }}>{children}</Ctx.Provider>;
}

/** Client-side translator: t(key, englishDefault, vars). */
export function useI18n() {
  const { locale, messages } = useContext(Ctx);
  const t = (key: string, def: string, vars?: Vars) => format(messages[key] ?? def, vars);
  return { locale, t };
}
