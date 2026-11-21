// Collects every t("key", "English default") from the source plus labels that live in data,
// and writes src/i18n/source.en.json, the file translators work from.
// Run: npx tsx scripts/extract-i18n.ts
import { readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { join } from "path";
import { SERVICES, BASIS_LABEL, CHANNEL_LABEL, GROUP_LABELS } from "../src/lib/pricing";
import { STATUS } from "../src/lib/status";

const out: Record<string, string> = {};
const conflicts: string[] = [];
const add = (k: string, v: string, where: string) => {
  if (k in out && out[k] !== v) conflicts.push(`${k}: "${out[k]}" vs "${v}" (${where})`);
  out[k] = v;
};

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (p.includes("generated")) return [];
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|ts)$/.test(p) ? [p] : [];
  });
}

const re = /\bt\(\s*"([a-zA-Z0-9_.]+)"\s*,\s*("(?:[^"\\]|\\.)*")/g;
for (const f of walk("src")) {
  const s = readFileSync(f, "utf8");
  for (const m of s.matchAll(re)) add(m[1], JSON.parse(m[2]), f);
}

for (const s of SERVICES) {
  add(`svc.${s.code}.name`, s.name, "pricing");
  add(`svc.${s.code}.detail`, s.detail, "pricing");
}
const plural: Record<string, string> = { unit: "units", carton: "cartons", pallet: "pallets", order: "orders" };
for (const [b, v] of Object.entries(BASIS_LABEL)) {
  add(`basis.${b}`, v, "pricing");
  add(`basis.${b}.plural`, plural[b], "pricing");
}
for (const [c, v] of Object.entries(CHANNEL_LABEL)) add(`channel.${c}`, v, "pricing");
for (const [g, v] of Object.entries(GROUP_LABELS)) add(`group.${g}`, v, "pricing");
for (const [s, v] of Object.entries(STATUS)) {
  add(`status.${s}`, v.label, "status");
  add(`status.${s}.hint`, v.hint, "status");
}
for (const [k, v] of Object.entries({ TOPUP: "Top-up", CHARGE: "Order", REFUND: "Refund", ADJUSTMENT: "Adjustment" })) add(`tx.${k}`, v, "balance");
for (const [k, v] of Object.entries({ OPEN: "Waiting for FoxPrep", ANSWERED: "Answered", CLOSED: "Closed" })) add(`ticket.status.${k}`, v, "tickets");

const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync("src/i18n/source.en.json", JSON.stringify(sorted, null, 2) + "\n");
console.log(`${Object.keys(sorted).length} strings`);
if (conflicts.length) {
  console.error("CONFLICTS:\n" + conflicts.join("\n"));
  process.exit(1);
}
