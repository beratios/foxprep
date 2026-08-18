import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password || password.length < 8) {
    return NextResponse.json({ error: "Missing fields, or password too short (min 8 chars)." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const user = await prisma.user.create({
    data: { name, email, password: hashed, verificationToken },
  });

  const origin = req.headers.get("origin") || "";
  await sendVerificationEmail(user.email, user.name, verificationToken, origin);

  await createSession({ userId: user.id, role: user.role, email: user.email });
  return NextResponse.json({ ok: true });
}
