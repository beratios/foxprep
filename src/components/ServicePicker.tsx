"use client";

import { SERVICES, rateFor, rateLabel, tierIndex, type Channel, type Service, type ServiceCode } from "@/lib/pricing";
import { useI18n } from "@/i18n/client";
import { L } from "@/i18n/labels";

export type ServiceValues = Partial<Record<ServiceCode, number>>;

export function defaultQty(s: Service, units: number) {
  if (s.basis === "unit") return s.code === "fbm_extra" ? Math.max(1, Math.round(units / 4)) : units;
  if (s.basis === "carton") return Math.max(1, Math.ceil(units / 60));
  if (s.basis === "order") return Math.max(1, Math.round(units / 2));
  return Math.max(1, Math.ceil(units / 1200));
}

export function ServicePicker({
  channel,
  units,
  values,
  onChange,
}: {
  channel: Channel;
  units: number;
  values: ServiceValues;
  onChange: (v: ServiceValues) => void;
}) {
  const { t } = useI18n();
  const tier = tierIndex(units);
  const groups = (["core", "packaging", "cartons", "pallets", "fbm"] as const)
    .map((g) => ({ g, items: SERVICES.filter((s) => s.group === g && s.channels.includes(channel)) }))
    .filter((x) => x.items.length);

  const toggle = (s: Service, on: boolean) => {
    const next = { ...values };
    if (on) next[s.code] = defaultQty(s, units);
    else delete next[s.code];
    onChange(next);
  };

  return (
    <div className="space-y-7">
      {groups.map(({ g, items }) => (
        <fieldset key={g}>
          <legend className="mb-2 text-[15px] font-bold text-ink">{L.group(t, g)}</legend>
          {(g === "cartons" || g === "pallets") && (
            <p className="mb-3 rounded-md bg-fox-tint/60 px-3 py-2 text-[13px] leading-snug text-ink-2">
              {g === "cartons"
                ? t("picker.cartonsNote", "Not sure how many cartons? Leave these blank. We count everything when it arrives and when it leaves, send you photos, and charge the exact amount from your balance before anything ships out.")
                : t("picker.palletsNote", "Not sure how many pallets? Leave these blank. We count everything when it arrives and when it leaves, send you photos, and charge the exact amount from your balance before anything ships out.")}
            </p>
          )}
          <ul className="divide-y divide-line rounded-lg border border-line bg-white">
            {items.map((s) => {
              const required = s.requiredFor?.includes(channel);
              const on = required || (values[s.code] ?? 0) > 0;
              const ti = s.code === "fbm_pick" ? tierIndex(values[s.code] ?? 0) : tier;
              const id = `svc-${s.code}`;
              return (
                <li key={s.code} className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 ${on ? "bg-fox-tint/40" : ""}`}>
                  <input
                    id={id}
                    type="checkbox"
                    className="h-5 w-5 shrink-0 accent-[#E8590C]"
                    checked={on}
                    disabled={required}
                    onChange={(e) => toggle(s, e.target.checked)}
                  />
                  <label htmlFor={id} className="min-w-0 flex-1 basis-[calc(100%-2.25rem)] cursor-pointer sm:basis-0">
                    <span className="block text-[15px] font-semibold leading-tight">{L.svcName(t, s)}{required && <span className="ms-2 text-xs font-medium text-ok">{t("picker.included", "Included")}</span>}</span>
                    <span className="block text-[13px] leading-snug text-ink-soft">{L.svcDetail(t, s)}</span>
                  </label>
                  <span className="tnum ms-9 text-sm font-semibold text-ink sm:ms-0 sm:w-[92px] sm:text-end">
                    {rateLabel(rateFor(s, ti))}<span className="font-normal text-ink-soft"> / {L.basis(t, s.basis)}</span>
                  </span>
                  {!required && on && (
                    <label className="flex items-center gap-2 text-sm text-ink-soft">
                      <span className="sr-only">{t("picker.qtyFor", "Quantity for {name}", { name: L.svcName(t, s) })}</span>
                      <span aria-hidden>×</span>
                      <input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        className="field tnum w-24 py-1.5"
                        value={values[s.code] ?? ""}
                        onChange={(e) => onChange({ ...values, [s.code]: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      />
                      <span>{L.basisPlural(t, s.basis)}</span>
                    </label>
                  )}
                  {required && <span className="tnum text-sm text-ink-soft">× {L.qty(t, units, "unit")}</span>}
                </li>
              );
            })}
          </ul>
        </fieldset>
      ))}
    </div>
  );
}

/** When the unit count changes, per-unit services that covered every unit keep covering every unit. */
export function followUnits(values: ServiceValues, prev: number, next: number): ServiceValues {
  const out: ServiceValues = { ...values };
  for (const s of SERVICES) {
    if (s.basis === "unit" && out[s.code] === prev) out[s.code] = next;
  }
  return out;
}
