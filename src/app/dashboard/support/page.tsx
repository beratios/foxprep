import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { TicketComposer } from "@/components/TicketComposer";
import { TicketBadge } from "@/components/TicketBadge";

export default async function Support({ searchParams }: { searchParams: { order?: string } }) {
  const user = await requireUser();
  const [tickets, orders] = await Promise.all([
    prisma.ticket.findMany({ where: { userId: user.id }, orderBy: { lastMessageAt: "desc" }, include: { order: { select: { ref: true } }, _count: { select: { messages: true } } } }),
    prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { id: true, ref: true }, take: 100 }),
  ]);
  return (
    <div className="max-w-5xl">
      <h1 className="h-page">Support</h1>
      <p className="mt-1 max-w-2xl text-ink-soft">Ask about an order, report a problem or send us photos. We usually answer within one business day.</p>

      <section className="panel mt-8 p-5">
        <h2 className="mb-4 text-lg font-bold">New request</h2>
        <TicketComposer endpoint="/api/tickets" newTicket orders={orders} defaultOrderId={orders.some((o) => o.id === searchParams.order) ? searchParams.order : undefined} submitLabel="Send request" placeholder="Tell us what happened. Photos help." />
      </section>

      <h2 className="mb-3 mt-10 text-lg font-bold">Your requests</h2>
      {tickets.length === 0 ? (
        <p className="panel p-6 text-ink-soft">No requests yet.</p>
      ) : (
        <ul className="panel divide-y divide-line">
          {tickets.map((t) => (
            <li key={t.id}>
              <Link href={`/dashboard/support/${t.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 hover:bg-paper">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{t.subject}</span>
                  <span className="tnum text-[13px] text-ink-soft">{t.ref}{t.order ? `, order ${t.order.ref}` : ""}, {t._count.messages} message{t._count.messages === 1 ? "" : "s"}, {t.lastMessageAt.toLocaleDateString("en-CA")}</span>
                </span>
                <TicketBadge status={t.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
