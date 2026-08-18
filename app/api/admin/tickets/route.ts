import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tickets = await prisma.ticket.findMany({
    include: { user: { select: { name: true, email: true } }, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ tickets });
}
