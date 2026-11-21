import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { TicketThread } from "@/components/TicketThread";
import { TicketComposer } from "@/components/TicketComposer";
import { TicketBadge } from "@/components/TicketBadge";
import { ActionButton } from "@/components/ActionButton";

export default async function TicketPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const t = await prisma.ticket.findFirst({
    where: { id: params.id, userId: user.id },
    include: { order: { select: { id: true, ref: true } }, messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!t) notFound();
  return (
    <div className="max-w-4xl">
      <Link href="/dashboard/support" className="text-sm font-semibold text-ink-soft hover:text-ink">All requests</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="h-page">{t.subject}</h1>
        <TicketBadge status={t.status} />
      </div>
      <p className="tnum mt-1 text-ink-soft">
        {t.ref}
        {t.order && <> about order <Link href={`/dashboard/orders/${t.order.id}`} className="font-semibold text-ink underline">{t.order.ref}</Link></>}
      </p>
      <div className="mt-8"><TicketThread messages={t.messages} viewerIsAdmin={false} /></div>
      <section className="panel mt-8 p-5">
        <TicketComposer endpoint={`/api/tickets/${t.id}/messages`} submitLabel={t.status === "CLOSED" ? "Reopen and send" : "Send reply"} placeholder="Write a reply" />
      </section>
      {t.status !== "CLOSED" && (
        <div className="mt-4">
          <ActionButton endpoint={`/api/tickets/${t.id}/status`} body={{ status: "CLOSED" }} className="text-sm font-semibold text-ink-soft hover:text-ink hover:underline">
            Mark as solved
          </ActionButton>
        </div>
      )}
    </div>
  );
}
