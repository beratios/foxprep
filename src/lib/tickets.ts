import type { TicketStatus } from "@/generated/prisma/client";
import { prisma } from "./db";
import { appUrl } from "./stripe";
import { esc, layout, sendEmail } from "./email";
import { code } from "./ids";

export const TICKET_STATUS: Record<TicketStatus, { label: string; cls: string }> = {
  OPEN: { label: "Waiting for FoxPrep", cls: "bg-fox-tint text-fox-dark" },
  ANSWERED: { label: "Answered", cls: "bg-ok/10 text-ok" },
  CLOSED: { label: "Closed", cls: "bg-line text-ink-soft" },
};

export async function newTicketRef() {
  let ref = `T-${code(5)}`;
  while (await prisma.ticket.findUnique({ where: { ref } })) ref = `T-${code(5)}`;
  return ref;
}

async function adminEmail() {
  if (process.env.ADMIN_NOTIFY_EMAIL) return process.env.ADMIN_NOTIFY_EMAIL;
  const a = await prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" }, select: { email: true } });
  return a?.email;
}

/** Email the other side of the conversation about a new message. Best effort. */
export async function notifyTicket(ticketId: string, fromAdmin: boolean, body: string, photos: string[]) {
  const t = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { user: true } });
  if (!t) return;
  if (fromAdmin) {
    await sendEmail(
      t.user.email,
      `FoxPrep replied: ${t.subject} (${t.ref})`,
      layout({
        heading: "We replied to your request",
        intro: `<strong>${esc(t.subject)}</strong><br/><br/>${esc(body).replace(/\n/g, "<br/>")}`,
        photos,
        cta: { label: "Open the conversation", href: `${appUrl()}/dashboard/support/${t.id}` },
      }),
    );
  } else {
    const to = await adminEmail();
    if (!to) return;
    await sendEmail(
      to,
      `Support ${t.ref} from ${t.user.company || t.user.name} (${t.user.customerCode})`,
      layout({
        heading: t.subject,
        intro: esc(body).replace(/\n/g, "<br/>"),
        photos,
        cta: { label: "Answer in admin", href: `${appUrl()}/admin/support/${t.id}` },
      }),
    );
  }
}
