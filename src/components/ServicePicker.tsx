"use client";

import { BASIS_LABEL, GROUP_LABELS, SERVICES, rateFor, rateLabel, tierIndex, type Channel, type Service, type ServiceCode } from "@/lib/pricing";

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
          <legend className="mb-2 text-[15px] font-bold text-ink">{GROUP_LABELS[g]}</legend>
          {(g === "cartons" || g === "pallets") && (
            <p className="mb-3 rounded-md bg-fox-tint/60 px-3 py-2 text-[13px] leading-snug text-ink-2">
              Not sure how many {g === "cartons" ? "cartons" : "pallets"}? Leave these blank. We count everything when it arrives and when it leaves, send you photos,
              and charge the exact amount from your balance before anything ships out.
            </p>
          )}
          <ul className="divide-y divide-line rounded-lg border border-line bg-white">
            {items.map((s) => {
              const required = s.requiredFor?.includes(channel);
              const on = required || (values[s.code] ?? 0) > 0;
              const t = s.code === "fbm_pick" ? tierIndex(values[s.code] ?? 0) : tier;
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
                    <span className="block text-[15px] font-semibold leading-tight">{s.name}{required && <span className="ml-2 text-xs font-medium text-ok">Included</span>}</span>
                    <span className="block text-[13px] leading-snug text-ink-soft">{s.detail}</span>
                  </label>
                  <span className="tnum ml-9 text-sm font-semibold text-ink sm:ml-0 sm:w-[92px] sm:text-right">
                    {rateLabel(rateFor(s, t))}<span className="font-normal text-ink-soft"> / {BASIS_LABEL[s.basis]}</span>
                  </span>
                  {!required && on && (
                    <label className="flex items-center gap-2 text-sm text-ink-soft">
                      <span className="sr-only">Quantity for {s.name}</span>
                      <span aria-hidden>×</span>
                      <input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        className="field tnum w-24 py-1.5"
                        value={values[s.code] ?? ""}
                        onChange={(e) => onChange({ ...values, [s.code]: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      />
                      <span>{BASIS_LABEL[s.basis]}s</span>
                    </label>
                  )}
                  {required && <span className="tnum text-sm text-ink-soft">× {units.toLocaleString()} units</span>}
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
