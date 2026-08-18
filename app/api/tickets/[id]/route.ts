import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { sendTicketReplyEmail } from "@/lib/email";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: { messages: { orderBy: { createdAt: "asc" } }, user: { select: { name: true, email: true } } },
  });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ticket.userId !== session.userId && session.role === "CUSTOMER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ ticket });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ticket = await prisma.ticket.findUnique({ where: { id: params.id }, include: { user: true } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ticket.userId !== session.userId && session.role === "CUSTOMER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { body, status } = await req.json();
  const message = await prisma.ticketMessage.create({
    data: { ticketId: params.id, senderRole: session.role, body },
  });

  const isStaffReply = session.role !== "CUSTOMER";

  if (status) {
    await prisma.ticket.update({ where: { id: params.id }, data: { status } });
  } else {
    await prisma.ticket.update({ where: { id: params.id }, data: { status: isStaffReply ? "PENDING" : "OPEN" } });
  }

  // Only notify the customer when the FoxPrep team replies — no need to
  // email staff every time a customer writes back.
  if (isStaffReply) {
    await sendTicketReplyEmail(ticket.user.email, ticket.user.name, ticket.subject);
  }

  return NextResponse.json({ message });
}
