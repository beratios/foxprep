import { BASIS_LABEL, HST_RATE, money, rateLabel, type Quote } from "@/lib/pricing";

export function QuoteSummary({ q, compact = false }: { q: Quote; compact?: boolean }) {
  return (
    <div>
      <ul className="space-y-2 text-[14px]">
        {q.lines.map((l) => (
          <li key={l.code} className="flex items-baseline justify-between gap-3">
            <span className="min-w-0">
              <span className="font-medium">{l.name}</span>
              {!compact && (
                <span className="tnum block text-[12.5px] text-ink-soft">
                  {l.qty.toLocaleString()} {BASIS_LABEL[l.basis]}{l.qty === 1 ? "" : "s"} × {rateLabel(l.rateCents)}
                </span>
              )}
            </span>
            <span className="tnum font-semibold">{money(l.amountCents)}</span>
          </li>
        ))}
      </ul>
      <dl className="tnum mt-4 space-y-1.5 border-t border-dashed border-ink/30 pt-3 text-[14px]">
        <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(q.subtotalCents)}</dd></div>
        <div className="flex justify-between text-ink-soft"><dt>HST ({Math.round(HST_RATE * 100)}%)</dt><dd>{money(q.taxCents)}</dd></div>
        <div className="flex items-baseline justify-between pt-1 text-lg font-extrabold"><dt>Total</dt><dd>{money(q.totalCents)}</dd></div>
        {q.units > 0 && <div className="flex justify-between text-[13px] text-ink-soft"><dt>Before tax, per unit</dt><dd>{money(q.perUnitCents)}</dd></div>}
      </dl>
    </div>
  );
}
