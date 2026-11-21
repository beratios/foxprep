import type { OrderStatus } from "@/generated/prisma/client";
import { STATUS } from "@/lib/status";
import { getI18n } from "@/i18n/server";
import { L } from "@/i18n/labels";

const TONES = {
  fox: "bg-fox-tint text-fox-dark",
  ink: "bg-ink/10 text-ink",
  ok: "bg-ok/10 text-ok",
  warn: "bg-[#FFF3C4] text-[#7A5A00]",
  muted: "bg-line text-ink-soft",
};

export async function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS[status];
  const { t } = await getI18n();
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[12.5px] font-semibold ${TONES[s.tone]}`}>{L.status(t, status)}</span>;
}
