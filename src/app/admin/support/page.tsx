import Link from "next/link";
import type { TicketStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { TicketBadge } from "@/components/TicketBadge";

const TABS: { key: TicketStatus | "ALL"; label: string }[] = [
  { key: "OPEN", label: "Needs reply" },
  { key: "ANSWERED", label: "Waiting for customer" },
  { key: "CLOSED", label: "Closed" },
  { key: "ALL", label: "All" },
];

export default async function AdminSupport({ searchParams }: { searchParams: { s?: string } }) {
  const tab = (TABS.find((t) => t.key === searchParams.s)?.key ?? "OPEN") as TicketStatus | "ALL";
  const tickets = await prisma.ticket.findMany({
    where: tab === "ALL" ? {} : { status: tab },
    orderBy: { lastMessageAt: tab === "OPEN" ? "asc" : "desc" },
    include: { user: { select: { name: true, company: true, customerCode: true } }, order: { select: { ref: true } } },
    take: 200,
  });
  return (
    <div className="max-w-6xl">
      <h1 className="h-page">Support</h1>
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin/support?s=${t.key}`} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold ${tab === t.key ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>
            {t.label}
          </Link>
        ))}
      </div>
      {tickets.length === 0 ? (
        <p className="panel mt-6 p-10 text-center text-ink-soft">{tab === "OPEN" ? "No requests need a reply." : "Nothing here."}</p>
      ) : (
        <ul className="panel mt-6 divide-y divide-line">
          {tickets.map((t) => (
            <li key={t.id}>
              <Link href={`/admin/support/${t.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 hover:bg-paper">
                <span className="tnum w-20 font-bold">{t.ref}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{t.subject}</span>
                  <span className="text-[13px] text-ink-soft">
                    <span className="tnum font-semibold text-fox-dark">{t.user.customerCode}</span> {t.user.company || t.user.name}
                    {t.order ? `, order ${t.order.ref}` : ""}
                  </span>
                </span>
                <span className="tnum text-[13px] text-ink-soft">{t.lastMessageAt.toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</span>
                <TicketBadge status={t.status} admin />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
