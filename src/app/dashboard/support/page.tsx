import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { TicketComposer } from "@/components/TicketComposer";
import { TicketBadge } from "@/components/TicketBadge";
import { getI18n } from "@/i18n/server";

export default async function Support({ searchParams }: { searchParams: { order?: string } }) {
  const { t } = await getI18n();
  const user = await requireUser();
  const [tickets, orders] = await Promise.all([
    prisma.ticket.findMany({ where: { userId: user.id }, orderBy: { lastMessageAt: "desc" }, include: { order: { select: { ref: true } }, _count: { select: { messages: true } } } }),
    prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { id: true, ref: true }, take: 100 }),
  ]);
  return (
    <div className="max-w-5xl">
      <h1 className="h-page">{t("support_page.support", "Support")}</h1>
      <p className="mt-1 max-w-2xl text-ink-soft">{t("support_page.ask_about_an_order_report_a_problem_or_s", "Ask about an order, report a problem or send us photos. We usually answer within one business day.")}</p>

      <section className="panel mt-8 p-5">
        <h2 className="mb-4 text-lg font-bold">{t("support_page.new_request", "New request")}</h2>
        <TicketComposer endpoint="/api/tickets" newTicket orders={orders} defaultOrderId={orders.some((o) => o.id === searchParams.order) ? searchParams.order : undefined} submitLabel={t("support.send", "Send request")} placeholder={t("support_page.tell_us_what_happened_photos_help", "Tell us what happened. Photos help.")} />
      </section>

      <h2 className="mb-3 mt-10 text-lg font-bold">{t("support_page.your_requests", "Your requests")}</h2>
      {tickets.length === 0 ? (
        <p className="panel p-6 text-ink-soft">{t("support_page.no_requests_yet", "No requests yet.")}</p>
      ) : (
        <ul className="panel divide-y divide-line">
          {tickets.map((tk) => (
            <li key={tk.id}>
              <Link href={`/dashboard/support/${tk.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 hover:bg-paper">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{tk.subject}</span>
                  <span className="tnum text-[13px] text-ink-soft">
                    {[
                      tk.ref,
                      tk.order && t("support.orderRef", "order {ref}", { ref: tk.order.ref }),
                      t("support.messages", "{n} messages", { n: tk._count.messages }),
                      tk.lastMessageAt.toLocaleDateString("en-CA"),
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </span>
                <TicketBadge status={tk.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
