// Single source of truth for FoxPrep pricing.
// Used by the public calculator, the customer cart and the server (which re-prices every order).
// All money is in integer cents (CAD).

export type Channel = "FBA" | "WFS" | "FBM";
export type Basis = "unit" | "carton" | "pallet" | "order";

export const HST_RATE = 0.13; // Ontario HST
export const FREE_STORAGE_DAYS = 14;

/** We're a prep center, not a warehouse: storage is priced to keep inventory moving. Cents per month. */
export const STORAGE = {
  palletMonth: 4000, // days 15–60
  boxMonth: 300,
  longAfterDays: 60,
  palletLongMonth: 8000, // after 60 days
  boxLongMonth: 600,
  palletMaxDays: 90, // pallets older than this are returned at the customer's cost
  maxPalletsPerCustomer: 6,
} as const;

/** Inbound pallets per order before we have to confirm space first */
export const MAX_PALLETS_PER_ORDER = 6;
export const CUSTOM_QUOTE_FROM = 5000;

export const TIERS = [
  { min: 1, max: 999, label: "1–999" },
  { min: 1000, max: 1999, label: "1,000–1,999" },
  { min: 2000, max: 4999, label: "2,000–4,999" },
] as const;

export type ServiceCode =
  | "prep"
  | "fbm_stock"
  | "polybag"
  | "bubble"
  | "bundle"
  | "shrink"
  | "sticker"
  | "relabel"
  | "carton_in"
  | "carton_out"
  | "box_small"
  | "box_supply"
  | "box_large"
  | "pallet_in"
  | "pallet_out"
  | "pallet_supply"
  | "fbm_pick"
  | "fbm_extra"
  | "fbm_mailer"
  | "fbm_box"
  | "fbm_box_large";

export interface Service {
  code: ServiceCode;
  name: string;
  detail: string;
  basis: Basis;
  /** Flat rate in cents, or one rate per tier */
  rate: number | readonly [number, number, number];
  channels: readonly Channel[];
  /** Included automatically for these channels, quantity = units */
  requiredFor?: readonly Channel[];
  group: "core" | "packaging" | "cartons" | "pallets" | "fbm";
}

export const SERVICES: readonly Service[] = [
  {
    code: "prep",
    name: "FBA / WFS prep",
    detail: "Receive, count, inspect, apply FNSKU or Walmart label",
    basis: "unit",
    rate: [65, 55, 45],
    channels: ["FBA", "WFS"],
    requiredFor: ["FBA", "WFS"],
    group: "core",
  },
  {
    code: "fbm_stock",
    name: "FBM stock-in",
    detail: "Receive, count, inspect and shelve for order fulfillment",
    basis: "unit",
    rate: [20, 15, 12],
    channels: ["FBM"],
    requiredFor: ["FBM"],
    group: "core",
  },
  { code: "polybag", name: "Poly bag", detail: "Clear bag with suffocation warning, heat-sealed", basis: "unit", rate: 20, channels: ["FBA", "WFS", "FBM"], group: "packaging" },
  { code: "bubble", name: "Bubble wrap", detail: "For glass, ceramics and fragile items", basis: "unit", rate: 50, channels: ["FBA", "WFS", "FBM"], group: "packaging" },
  { code: "bundle", name: "Bundle / multipack", detail: "Per unit that goes into a bundle, includes 'Sold as set' sticker", basis: "unit", rate: 25, channels: ["FBA", "WFS", "FBM"], group: "packaging" },
  { code: "shrink", name: "Shrink wrap", detail: "Heat shrink for sets and loose parts", basis: "unit", rate: 35, channels: ["FBA", "WFS", "FBM"], group: "packaging" },
  { code: "sticker", name: "Extra sticker", detail: "Expiry date, warning or 'Made in' label", basis: "unit", rate: 10, channels: ["FBA", "WFS", "FBM"], group: "packaging" },
  { code: "relabel", name: "Cover old barcode", detail: "Cover supplier UPC or old labels", basis: "unit", rate: 10, channels: ["FBA", "WFS", "FBM"], group: "packaging" },
  { code: "carton_in", name: "Carton receiving", detail: "Per inbound carton from your supplier", basis: "carton", rate: 150, channels: ["FBA", "WFS", "FBM"], group: "cartons" },
  { code: "carton_out", name: "Outbound carton", detail: "Pack, box contents, carton label for Amazon or Walmart", basis: "carton", rate: 250, channels: ["FBA", "WFS"], group: "cartons" },
  { code: "box_small", name: "New box, small", detail: "Up to 14 in. on the longest side. When supplier cartons can't be reused", basis: "carton", rate: 300, channels: ["FBA", "WFS"], group: "cartons" },
  { code: "box_supply", name: "New box, medium", detail: "Up to 18×18×18 in.", basis: "carton", rate: 550, channels: ["FBA", "WFS"], group: "cartons" },
  { code: "box_large", name: "New box, large", detail: "Up to 24×18×18 in., the largest size Amazon accepts", basis: "carton", rate: 750, channels: ["FBA", "WFS"], group: "cartons" },
  { code: "pallet_in", name: "Pallet receiving", detail: "Check and break down an inbound pallet. Liftgate delivery required", basis: "pallet", rate: 1500, channels: ["FBA", "WFS", "FBM"], group: "pallets" },
  { code: "pallet_out", name: "Pallet build", detail: "Stack, stretch-wrap and label to Amazon pallet rules", basis: "pallet", rate: 2000, channels: ["FBA", "WFS"], group: "pallets" },
  { code: "pallet_supply", name: "Pallet supply", detail: "Heat-treated 48×40 pallet", basis: "pallet", rate: 1200, channels: ["FBA", "WFS"], group: "pallets" },
  { code: "fbm_pick", name: "FBM order", detail: "Pick, pack and attach your shipping label, first item. Postage not included", basis: "order", rate: [300, 275, 250], channels: ["FBM"], group: "fbm" },
  { code: "fbm_extra", name: "Extra item in order", detail: "Each additional item in the same FBM order", basis: "unit", rate: 50, channels: ["FBM"], group: "fbm" },
  { code: "fbm_mailer", name: "Poly mailer", detail: "Padded or plain poly mailer for soft items", basis: "order", rate: 35, channels: ["FBM"], group: "fbm" },
  { code: "fbm_box", name: "Shipping box, small", detail: "Up to 12 in. on the longest side, with void fill", basis: "order", rate: 125, channels: ["FBM"], group: "fbm" },
  { code: "fbm_box_large", name: "Shipping box, large", detail: "Up to 18 in. on the longest side, with void fill", basis: "order", rate: 250, channels: ["FBM"], group: "fbm" },
] as const;

export const SERVICE_BY_CODE = Object.fromEntries(SERVICES.map((s) => [s.code, s])) as Record<ServiceCode, Service>;

export const GROUP_LABELS: Record<Service["group"], string> = {
  core: "Included prep",
  packaging: "Packaging, per unit",
  cartons: "Cartons",
  pallets: "Pallets",
  fbm: "FBM fulfillment",
};

export function tierIndex(qty: number): number {
  if (qty >= 2000) return 2;
  if (qty >= 1000) return 1;
  return 0;
}

export function rateFor(service: Service, tier: number): number {
  return typeof service.rate === "number" ? service.rate : service.rate[tier];
}

export interface QuoteInput {
  channel: Channel;
  units: number;
  /** Optional services with quantity. Required services are added automatically. */
  services: Partial<Record<ServiceCode, number>>;
}

export interface QuoteLine {
  code: ServiceCode;
  name: string;
  basis: Basis;
  qty: number;
  rateCents: number;
  amountCents: number;
}

export interface Quote {
  channel: Channel;
  units: number;
  tier: number;
  tierLabel: string;
  customQuote: boolean;
  lines: QuoteLine[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  perUnitCents: number;
}

const clampInt = (n: unknown, max = 1_000_000) => {
  const v = Math.floor(Number(n));
  return Number.isFinite(v) && v > 0 ? Math.min(v, max) : 0;
};

export function quote(input: QuoteInput): Quote {
  const units = clampInt(input.units);
  const channel = input.channel;
  const tier = tierIndex(units);
  const lines: QuoteLine[] = [];

  for (const s of SERVICES) {
    if (!s.channels.includes(channel)) continue;
    let qty = 0;
    if (s.requiredFor?.includes(channel)) qty = units;
    else qty = clampInt(input.services[s.code]);
    if (!qty) continue;
    // FBM pick fee is tiered by number of orders, everything else by units
    const t = s.code === "fbm_pick" ? tierIndex(qty) : tier;
    const rateCents = rateFor(s, t);
    lines.push({ code: s.code, name: s.name, basis: s.basis, qty, rateCents, amountCents: rateCents * qty });
  }

  const subtotalCents = lines.reduce((a, l) => a + l.amountCents, 0);
  const taxCents = Math.round(subtotalCents * HST_RATE);
  return {
    channel,
    units,
    tier,
    tierLabel: units >= CUSTOM_QUOTE_FROM ? "5,000+" : TIERS[tier].label,
    customQuote: units >= CUSTOM_QUOTE_FROM,
    lines,
    subtotalCents,
    taxCents,
    totalCents: subtotalCents + taxCents,
    perUnitCents: units ? Math.round(subtotalCents / units) : 0,
  };
}

export function money(cents: number, opts: { cents?: boolean } = {}): string {
  const v = cents / 100;
  return v.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: opts.cents === false ? 0 : 2,
  });
}

export function rateLabel(cents: number): string {
  return cents < 100 ? `${cents}¢` : money(cents);
}

export const BASIS_LABEL: Record<Basis, string> = { unit: "unit", carton: "carton", pallet: "pallet", order: "order" };

export const CHANNEL_LABEL: Record<Channel, string> = {
  FBA: "Amazon FBA",
  WFS: "Walmart WFS",
  FBM: "FBM / own fulfillment",
};
