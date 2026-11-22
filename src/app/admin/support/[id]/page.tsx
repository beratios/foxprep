import { WaLink } from "@/components/WaLink";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TicketThread } from "@/components/TicketThread";
import { TicketComposer } from "@/components/TicketComposer";
import { TicketBadge } from "@/components/TicketBadge";
import { ActionButton } from "@/components/ActionButton";

export default async function AdminTicket({ params }: { params: { id: string } }) {
  const t = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: { user: true, order: { select: { id: true, ref: true } }, messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!t) notFound();
  return (
    <div className="max-w-4xl">
      <Link href="/admin/support" className="text-sm font-semibold text-ink-soft hover:text-ink">All requests</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="h-page">{t.subject}</h1>
        <TicketBadge status={t.status} admin />
      </div>
      <p className="mt-1 text-ink-soft">
        <span className="tnum">{t.ref}</span> from <span className="tnum font-semibold text-fox-dark">{t.user.customerCode}</span> {t.user.company || t.user.name}, {t.user.email}
        {t.user.phone && <>, <WaLink phone={t.user.phone} /></>}
        {t.order && <> about <Link href={`/admin/orders/${t.order.id}`} className="font-semibold text-ink underline">{t.order.ref}</Link></>}
      </p>
      <div className="mt-8"><TicketThread messages={t.messages} viewerIsAdmin /></div>
      <section className="panel mt-8 p-5">
        <TicketComposer endpoint={`/api/tickets/${t.id}/messages`} submitLabel="Send reply" placeholder="Write your answer. The customer gets it in their dashboard and by email." />
      </section>
      <div className="mt-4 flex gap-4">
        {t.status !== "CLOSED" ? (
          <ActionButton endpoint={`/api/tickets/${t.id}/status`} body={{ status: "CLOSED" }} className="text-sm font-semibold text-ink-soft hover:text-ink hover:underline">Close request</ActionButton>
        ) : (
          <ActionButton endpoint={`/api/tickets/${t.id}/status`} body={{ status: "OPEN" }} className="text-sm font-semibold text-ink-soft hover:text-ink hover:underline">Reopen</ActionButton>
        )}
      </div>
    </div>
  );
}
