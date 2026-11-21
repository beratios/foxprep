// Translated labels for data that lives in code (services, statuses, channels).
// English text stays in pricing.ts/status.ts and is the fallback.
import { BASIS_LABEL, CHANNEL_LABEL, GROUP_LABELS, SERVICE_BY_CODE, type Basis, type Channel, type Service, type ServiceCode } from "@/lib/pricing";
import { STATUS } from "@/lib/status";
import type { Vars } from "./config";

type T = (key: string, def: string, vars?: Vars) => string;

const PLURAL: Record<Basis, string> = { unit: "units", carton: "cartons", pallet: "pallets", order: "orders" };

export const L = {
  svcName: (t: T, s: Service | ServiceCode) => {
    const svc = typeof s === "string" ? SERVICE_BY_CODE[s] : s;
    return t(`svc.${svc.code}.name`, svc.name);
  },
  svcDetail: (t: T, s: Service) => t(`svc.${s.code}.detail`, s.detail),
  basis: (t: T, b: Basis) => t(`basis.${b}`, BASIS_LABEL[b]),
  basisPlural: (t: T, b: Basis) => t(`basis.${b}.plural`, PLURAL[b]),
  /** "1,200 units", "1 carton" */
  qty: (t: T, n: number, b: Basis) => `${n.toLocaleString()} ${n === 1 ? L.basis(t, b) : L.basisPlural(t, b)}`,
  group: (t: T, g: Service["group"]) => t(`group.${g}`, GROUP_LABELS[g]),
  channel: (t: T, c: Channel) => t(`channel.${c}`, CHANNEL_LABEL[c]),
  status: (t: T, s: keyof typeof STATUS) => t(`status.${s}`, STATUS[s].label),
  statusHint: (t: T, s: keyof typeof STATUS) => t(`status.${s}.hint`, STATUS[s].hint),
};
