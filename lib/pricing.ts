// Shared pricing logic used by both the customer order form and the admin
// preview. Rates are read from PricingSetting in the DB (editable by admin),
// never hardcoded past this file's defaults, which only serve as a fallback
// before the settings row is seeded.
//
// IMPORTANT — two things that are easy to get wrong and were wrong in the
// first version of this file:
//
// 1. Tier is decided by the customer's ROLLING 30-DAY unit volume across all
//    their outbound shipments, INCLUDING the one being created — not by the
//    size of a single shipment in isolation. A customer shipping 5×100 units
//    across a month is a 500-unit account, not five separate 100-unit
//    accounts. Always pass `rolling30DayUnits` (existing shipped units in
//    the last 30 days, before this one) into quoteOutbound().
//
// 2. This is a one-time, per-shipment charge — NOT a monthly subscription.
//    The only recurring monthly charge is storage past 5 days, applied
//    explicitly via the admin billing action, never automatically here.
//
// Tax: the warehouse is in Ontario, so this is HST (13%), not Quebec's
// GST+QST split.

export type PricingRates = {
  silverRateUnit: number;
  platinumRateUnit: number;
  diamondRateUnit: number;
  polyRate: number;
  bundleRate: number;
  insertRate: number;
  storageRatePerBoxMonth: number;
  hstRate: number;
};

export const DEFAULT_RATES: PricingRates = {
  silverRateUnit: 0.95,
  platinumRateUnit: 0.78,
  diamondRateUnit: 0.62,
  polyRate: 0.6,
  bundleRate: 0.75,
  insertRate: 0.15,
  storageRatePerBoxMonth: 5.0,
  hstRate: 0.13,
};

export type Tier = "silver" | "platinum" | "diamond";

// `totalUnits` is the rolling 30-day volume INCLUDING the shipment being
// quoted — i.e. rolling30DayUnits (prior shipments) + unitsInThisShipment.
export function tierForVolume(totalUnits: number): Tier {
  if (totalUnits >= 5000) return "diamond";
  if (totalUnits >= 1000) return "platinum";
  return "silver";
}

export type OutboundQuote = {
  tier: Tier;
  rate: number;
  base: number;
  poly: number;
  bundle: number;
  insert: number;
  subtotal: number;
  tax: number;
  total: number;
};

export function quoteOutbound(
  unitsInThisShipment: number,
  rolling30DayUnits: number,
  addons: { polybagQty?: number; bundleQty?: number; insertQty?: number },
  rates: PricingRates = DEFAULT_RATES
): OutboundQuote {
  const totalUnits = rolling30DayUnits + unitsInThisShipment;
  const tier = tierForVolume(totalUnits);
  const rate = tier === "diamond" ? rates.diamondRateUnit : tier === "platinum" ? rates.platinumRateUnit : rates.silverRateUnit;

  const base = unitsInThisShipment * rate;
  const poly = (addons.polybagQty ?? 0) * rates.polyRate;
  const bundle = (addons.bundleQty ?? 0) * rates.bundleRate;
  const insert = (addons.insertQty ?? 0) * rates.insertRate;
  const subtotal = base + poly + bundle + insert;
  const tax = subtotal * rates.hstRate;

  return { tier, rate, base, poly, bundle, insert, subtotal, tax, total: subtotal + tax };
}

// The one genuinely recurring charge: storage for inventory sitting past the
// free 5-day window. Call this from the admin billing action (or a monthly
// cron once you're ready for one) — never from shipment creation.
export function calculateStorageFee(boxCount: number, rates: PricingRates = DEFAULT_RATES) {
  return boxCount * rates.storageRatePerBoxMonth;
}

export const FREE_STORAGE_DAYS = 5;
