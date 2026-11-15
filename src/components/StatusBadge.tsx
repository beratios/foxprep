import type { OrderStatus } from "@/generated/prisma/client";
import { STATUS } from "@/lib/status";

const TONES = {
  fox: "bg-fox-tint text-fox-dark",
  ink: "bg-ink/10 text-ink",
  ok: "bg-ok/10 text-ok",
  warn: "bg-[#FFF3C4] text-[#7A5A00]",
  muted: "bg-line text-ink-soft",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS[status];
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[12.5px] font-semibold ${TONES[s.tone]}`}>{s.label}</span>;
}
