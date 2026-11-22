/** ISO country → international calling code. Names come from Intl.DisplayNames in the visitor's language. */
export const DIAL_CODES: Record<string, string> = {
  CA: "1", US: "1", MX: "52", BR: "55", AR: "54", CO: "57", CL: "56", PE: "51", VE: "58", EC: "593", DO: "1", JM: "1", TT: "1", CU: "53", GT: "502", CR: "506", PA: "507",
  GB: "44", IE: "353", FR: "33", DE: "49", IT: "39", ES: "34", PT: "351", NL: "31", BE: "32", CH: "41", AT: "43", LU: "352",
  SE: "46", NO: "47", DK: "45", FI: "358", IS: "354", PL: "48", CZ: "420", SK: "421", HU: "36", RO: "40", BG: "359", GR: "30", CY: "357", MT: "356",
  HR: "385", SI: "386", RS: "381", BA: "387", MK: "389", AL: "355", ME: "382", XK: "383", MD: "373", UA: "380", BY: "375", RU: "7", LT: "370", LV: "371", EE: "372",
  TR: "90", AZ: "994", GE: "995", AM: "374", KZ: "7", UZ: "998", KG: "996", TJ: "992", TM: "993",
  IL: "972", PS: "970", LB: "961", SY: "963", JO: "962", IQ: "964", IR: "98", SA: "966", AE: "971", QA: "974", KW: "965", BH: "973", OM: "968", YE: "967",
  EG: "20", MA: "212", DZ: "213", TN: "216", LY: "218", SD: "249", ET: "251", KE: "254", TZ: "255", UG: "256", RW: "250", NG: "234", GH: "233", CI: "225", SN: "221", CM: "237", ZA: "27", ZW: "263", SO: "252",
  IN: "91", PK: "92", BD: "880", LK: "94", NP: "977", AF: "93",
  CN: "86", HK: "852", TW: "886", JP: "81", KR: "82", VN: "84", TH: "66", MY: "60", SG: "65", ID: "62", PH: "63", KH: "855", MM: "95",
  AU: "61", NZ: "64",
};

const LOCALE_COUNTRY: Record<string, string> = { tr: "TR", de: "DE", fr: "CA", es: "MX", pt: "BR", it: "IT", ru: "RU", uk: "UA", ar: "SA", fa: "IR", hi: "IN", pa: "IN", zh: "CN", vi: "VN" };

/** Best guess for the visitor's country: hosting geo header first, then site language, then Canada. */
export function guessCountry(geo: string | null | undefined, locale: string): string {
  const g = (geo || "").toUpperCase();
  if (g in DIAL_CODES) return g;
  return LOCALE_COUNTRY[locale] ?? "CA";
}

export const flagEmoji = (iso: string) => String.fromCodePoint(...[...iso].map((c) => 0x1f1a5 + c.charCodeAt(0)));
