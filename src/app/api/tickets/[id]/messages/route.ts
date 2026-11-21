import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { UploadError, uploadImages } from "@/lib/upload";
import { notifyTicket } from "@/lib/tickets";

/** Reply on a ticket, from the customer who owns it or from an admin. multipart: body, files[] */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Log in again." }, { status: 401 });
  const isAdmin = s.role === "ADMIN";
  const ticket = await prisma.ticket.findFirst({ where: isAdmin ? { id: params.id } : { id: params.id, userId: s.uid } });
  if (!ticket) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  const me = await prisma.user.findUnique({ where: { id: s.uid }, select: { name: true } });

  const form = await req.formData();
  const body = String(form.get("body") || "").trim().slice(0, 5000);
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!body && !files.length) return NextResponse.json({ error: "Write a message or attach a photo.", field: "body" }, { status: 400 });

  let photos: string[] = [];
  try {
    photos = await uploadImages(files, `tickets/${ticket.ref}`);
  } catch (e) {
    return NextResponse.json({ error: e instanceof UploadError ? e.message : "Photo upload failed." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.ticketMessage.create({ data: { ticketId: ticket.id, fromAdmin: isAdmin, author: isAdmin ? "FoxPrep" : me?.name || "Customer", body, photos } }),
    prisma.ticket.update({ where: { id: ticket.id }, data: { status: isAdmin ? "ANSWERED" : "OPEN", lastMessageAt: new Date() } }),
  ]);
  await notifyTicket(ticket.id, isAdmin, body, photos).catch(() => {});
  return NextResponse.json({ ok: true });
}
