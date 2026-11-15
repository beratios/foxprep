import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Log in again." }, { status: 401 });
  await prisma.product.deleteMany({ where: { id: params.id, userId: s.uid } });
  return NextResponse.json({ ok: true });
}
