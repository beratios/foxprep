import { prisma } from "./db";
import { layout, orderLink, sendEmail, esc } from "./email";
import { warehouse, attentionLine } from "./warehouse";
import { STATUS } from "./status";
import { CHANNEL_LABEL, money } from "./pricing";

/** Email sent once an order is paid: the address the supplier needs. */
export async function notifyOrderPaid(orderId: string) {
  const o = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true } });
  if (!o) return;
  const w = warehouse();
  const who = o.user.company || o.user.name;
  const addr = [`${who} c/o ${w.name}`, attentionLine(o.user.customerCode, o.ref), w.street, `${w.city}, ${w.province} ${w.postal}`, w.country, w.phone].map(esc).join("<br/>");
  await sendEmail(
    o.user.email,
    `Order ${o.ref} confirmed: send your supplier this address`,
    layout({
      heading: `Order ${o.ref} is confirmed`,
      intro: `We received ${money(o.totalCents)}. Send the address below to your supplier and ask them to print the ATTN line on every carton.`,
      rows: [
        ["Destination", esc(CHANNEL_LABEL[o.channel])],
        ["Units", o.units.toLocaleString()],
        ["Ship to", addr],
      ],
      cta: { label: "View order", href: orderLink(o.id) },
      footer: "You are the importer of record: your name or company goes on the commercial invoice, and duties and taxes are billed to you.",
    }),
  );
}

const COPY: Partial<Record<string, { subject: string; intro: string }>> = {
  RECEIVED: { subject: "Your shipment arrived", intro: "Your cartons are at our warehouse. Photos from the dock are below." },
  IN_PREP: { subject: "We're prepping your order", intro: "We've started labeling and packing your units." },
  SHIPPED: { subject: "Your order shipped", intro: "Your inventory is on its way. Photos of the packed shipment and the tracking number are below." },
  COMPLETED: { subject: "Order completed", intro: "This order is complete. Thanks for working with FoxPrep." },
  CANCELLED: { subject: "Order cancelled", intro: "This order was cancelled." },
  AWAITING_INBOUND: { subject: "Waiting for your shipment", intro: "We're ready to receive your cartons." },
};

/** Email for an admin status change, with the photos that belong to that step. */
export async function notifyStatus(orderId: string, note?: string | null) {
  const o = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true, items: true, photos: { orderBy: { createdAt: "asc" } } } });
  if (!o) return;
  const copy = COPY[o.status];
  if (!copy) return;
  const kind = o.status === "SHIPPED" || o.status === "COMPLETED" ? "OUTBOUND" : "INBOUND";
  const photos = o.status === "RECEIVED" || o.status === "SHIPPED" ? o.photos.filter((p) => p.kind === kind).map((p) => p.url) : [];
  const rows: [string, string][] = [["Status", esc(STATUS[o.status].label)]];
  if (o.status === "RECEIVED" && o.items.some((i) => i.receivedQty != null))
    rows.push(["Counted", o.items.map((i) => `${esc(i.title)}: ${i.receivedQty ?? "–"} of ${i.quantity}`).join("<br/>")]);
  if (o.outboundTracking && (o.status === "SHIPPED" || o.status === "COMPLETED")) rows.push(["Tracking", esc(o.outboundTracking)]);
  if (note) rows.push(["Note", esc(note)]);
  await sendEmail(
    o.user.email,
    `${copy.subject}: ${o.ref}`,
    layout({
      heading: `${copy.subject}`,
      intro: `Order ${o.ref}. ${copy.intro}`,
      rows,
      photos,
      cta: { label: "View order and all photos", href: orderLink(o.id) },
    }),
  );
}
