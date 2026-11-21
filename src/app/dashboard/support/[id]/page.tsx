import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { TicketThread } from "@/components/TicketThread";
import { TicketComposer } from "@/components/TicketComposer";
import { TicketBadge } from "@/components/TicketBadge";
import { ActionButton } from "@/components/ActionButton";
import { getI18n } from "@/i18n/server";

export default async function TicketPage({ params }: { params: { id: string } }) {
  const { t } = await getI18n();
  const user = await requireUser();
  const tk = await prisma.ticket.findFirst({
    where: { id: params.id, userId: user.id },
    include: { order: { select: { id: true, ref: true } }, messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!tk) notFound();
  return (
    <div className="max-w-4xl">
      <Link href="/dashboard/support" className="text-sm font-semibold text-ink-soft hover:text-ink">{t("ticket.all", "All requests")}</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="h-page">{tk.subject}</h1>
        <TicketBadge status={tk.status} />
      </div>
      <p className="tnum mt-1 text-ink-soft">
        {tk.ref}
        {tk.order && (
          <>
            {" "}
            {t("ticket.aboutOrder", "about order")}{" "}
            <Link href={`/dashboard/orders/${tk.order.id}`} className="font-semibold text-ink underline">{tk.order.ref}</Link>
          </>
        )}
      </p>
      <div className="mt-8"><TicketThread messages={tk.messages} viewerIsAdmin={false} /></div>
      <section className="panel mt-8 p-5">
        <TicketComposer
          endpoint={`/api/tickets/${tk.id}/messages`}
          submitLabel={tk.status === "CLOSED" ? t("ticket.reopenSend", "Reopen and send") : t("ticket.sendReply", "Send reply")}
          placeholder={t("ticket.writeReply", "Write a reply")}
        />
      </section>
      {tk.status !== "CLOSED" && (
        <div className="mt-4">
          <ActionButton endpoint={`/api/tickets/${tk.id}/status`} body={{ status: "CLOSED" }} className="text-sm font-semibold text-ink-soft hover:text-ink hover:underline">
            {t("ticket.solved", "Mark as solved")}
          </ActionButton>
        </div>
      )}
    </div>
  );
}
