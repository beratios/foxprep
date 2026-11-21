import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { UploadError, uploadImages } from "@/lib/upload";
import { newTicketRef, notifyTicket } from "@/lib/tickets";

/** Customer opens a ticket. multipart: subject, body, orderId?, files[] */
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Log in again." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: s.uid } });
  if (!user) return NextResponse.json({ error: "Log in again." }, { status: 401 });

  const form = await req.formData();
  const subject = String(form.get("subject") || "").trim().slice(0, 160);
  const body = String(form.get("body") || "").trim().slice(0, 5000);
  const orderIdRaw = String(form.get("orderId") || "");
  if (!subject) return NextResponse.json({ error: "Add a subject.", field: "subject" }, { status: 400 });
  if (!body) return NextResponse.json({ error: "Write a message.", field: "body" }, { status: 400 });
  const order = orderIdRaw ? await prisma.order.findFirst({ where: { id: orderIdRaw, userId: user.id }, select: { id: true } }) : null;

  const ref = await newTicketRef();
  let photos: string[] = [];
  try {
    photos = await uploadImages(form.getAll("files").filter((f): f is File => f instanceof File), `tickets/${ref}`);
  } catch (e) {
    return NextResponse.json({ error: e instanceof UploadError ? e.message : "Photo upload failed." }, { status: 400 });
  }

  const ticket = await prisma.ticket.create({
    data: {
      ref,
      userId: user.id,
      orderId: order?.id ?? null,
      subject,
      messages: { create: { fromAdmin: false, author: user.name, body, photos } },
    },
  });
  await notifyTicket(ticket.id, false, body, photos).catch(() => {});
  return NextResponse.json({ ok: true, url: `/dashboard/support/${ticket.id}` });
}
