import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** Close or reopen a ticket. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Log in again." }, { status: 401 });
  const { status } = await req.json().catch(() => ({}));
  if (!["OPEN", "ANSWERED", "CLOSED"].includes(status)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  const isAdmin = s.role === "ADMIN";
  const updated = await prisma.ticket.updateMany({
    where: isAdmin ? { id: params.id } : { id: params.id, userId: s.uid },
    data: { status: isAdmin ? status : status === "CLOSED" ? "CLOSED" : "OPEN" },
  });
  if (!updated.count) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
