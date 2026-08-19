// Shared pricing logic used by the inbound-receiving payment step and the
// admin preview. Rates are read from PricingSetting in the DB (editable by
// admin), never hardcoded past this file's defaults, which only serve as a
// fallback before the settings row is seeded.
//
// IMPORTANT — how billing actually works in this app:
//
// 1. Prep is billed when stock is RECEIVED (inbound), not when it's later
//    shipped out. Right after staff counts the actual received quantity,
//    the customer (or staff on their behalf) picks add-on services
//    (poly-bagging, bundling, custom insert — labeling is mandatory and
//    already baked into rateApplied) and pays before any prep work starts.
//    Outbound shipments (sending stock to Amazon/customers) don't charge
//    anything further — that stock was already paid for.
//
// 2. Tier is decided by the customer's ROLLING 30-DAY unit volume across all
//    their PAID inbound shipments, INCLUDING the one being quoted — not by
//    the size of a single shipment in isolation. A customer receiving 5×100
//    units across a month is a 500-unit account, not five separate 100-unit
//    accounts. Always pass `rolling30DayUnits` (prior paid-in units in the
//    last 30 days, before this one) into quotePrepWork().
//
// 3. This is a one-time, per-shipment charge — NOT a monthly subscription.
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
// quoted — i.e. rolling30DayUnits (prior paid shipments) + unitsInThisShipment.
export function tierForVolume(totalUnits: number): Tier {
  if (totalUnits >= 5000) return "diamond";
  if (totalUnits >= 1000) return "platinum";
  return "silver";
}

export type PrepQuote = {
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

export function quotePrepWork(
  unitsInThisShipment: number,
  rolling30DayUnits: number,
  addons: { polybagQty?: number; bundleQty?: number; insertQty?: number },
  rates: PricingRates = DEFAULT_RATES
): PrepQuote {
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
