import type { Channel, ServiceCode } from "./pricing";
import { SERVICE_BY_CODE } from "./pricing";

export function encodeCart(channel: Channel, units: number, services: Partial<Record<ServiceCode, number>>) {
  const s = Object.entries(services)
    .filter(([, q]) => q && q > 0)
    .map(([c, q]) => `${c}:${q}`)
    .join(",");
  const p = new URLSearchParams({ c: channel, u: String(units) });
  if (s) p.set("s", s);
  return p.toString();
}

export function decodeCart(sp: Record<string, string | string[] | undefined>) {
  const c = String(sp.c || "FBA").toUpperCase();
  const channel: Channel = c === "WFS" || c === "FBM" ? c : "FBA";
  const units = Math.max(1, Math.min(100000, parseInt(String(sp.u || "500"), 10) || 500));
  const services: Partial<Record<ServiceCode, number>> = {};
  for (const pair of String(sp.s || "").split(",")) {
    const [code, q] = pair.split(":");
    if (code in SERVICE_BY_CODE && Number(q) > 0) services[code as ServiceCode] = Math.floor(Number(q));
  }
  return { channel, units, services };
}
