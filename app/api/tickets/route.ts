import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where = session.role === "CUSTOMER" ? { userId: session.userId } : {};
  const tickets = await prisma.ticket.findMany({
    where,
    include: { messages: { orderBy: { createdAt: "asc" }, take: 1 }, user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ tickets });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subject, message } = await req.json();
  if (!subject || !message) {
    return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
  }

  const ticket = await prisma.ticket.create({
    data: {
      userId: session.userId,
      subject,
      messages: { create: { senderRole: session.role, body: message } },
    },
    include: { messages: true },
  });

  return NextResponse.json({ ticket });
}
