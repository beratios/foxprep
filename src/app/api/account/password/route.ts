import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Log in again." }, { status: 401 });
  const { current, next } = await req.json().catch(() => ({}));
  if (typeof next !== "string" || next.length < 8) return NextResponse.json({ error: "Use at least 8 characters for the new password." }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: s.uid } });
  if (!user || !(await bcrypt.compare(String(current || ""), user.passwordHash)))
    return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  return NextResponse.json({ ok: true });
}
