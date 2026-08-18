// Central place for brand/company constants. Edit these as the business
// details change — nothing else in the codebase should hardcode them.

export const COMPANY_NAME = "FoxPrep";

export const WHATSAPP_NUMBER = "14378184457"; // digits only, used for wa.me links
export const WHATSAPP_DISPLAY = "+1 (437) 818-4457";

export const WAREHOUSE_ADDRESS = {
  line1: `${COMPANY_NAME} Warehouse`,
  line2: "20 Radison Lane",
  line3: "Hamilton, ON L8H 0B5, Canada",
};

export const SUPPORTED_LOCALES = ["en", "tr", "es", "fr", "zh", "ar"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const RTL_LOCALES: Locale[] = ["ar"];
