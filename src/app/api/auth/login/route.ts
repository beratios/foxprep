import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  const user = email ? await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } }) : null;
  if (!user || !(await bcrypt.compare(String(password || ""), user.passwordHash)))
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  await setSessionCookie({ uid: user.id, role: user.role });
  return NextResponse.json({ ok: true, role: user.role });
}
