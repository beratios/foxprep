import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, dirOf, format, isLocale, type Locale, type Vars } from "./config";
import { loadMessages } from "./load";

export function getLocale(): Locale {
  const v = cookies().get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

/** Server-side translator: t(key, englishDefault, vars). */
export async function getI18n() {
  const locale = getLocale();
  const messages = await loadMessages(locale);
  const t = (key: string, def: string, vars?: Vars) => format(messages[key] ?? def, vars);
  return { locale, dir: dirOf(locale), messages, t };
}
