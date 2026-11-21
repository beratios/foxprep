import type { TicketStatus } from "@/generated/prisma/client";
import { TICKET_STATUS } from "@/lib/tickets";

export function TicketBadge({ status, admin = false }: { status: TicketStatus; admin?: boolean }) {
  const s = TICKET_STATUS[status];
  const label = admin && status === "OPEN" ? "Needs reply" : admin && status === "ANSWERED" ? "Waiting for customer" : s.label;
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[12.5px] font-semibold ${s.cls}`}>{label}</span>;
}
