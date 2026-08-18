import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return ok, even if the email doesn't exist — don't leak which
  // emails are registered.
  if (!user) return NextResponse.json({ ok: true });

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiresAt },
  });

  const origin = req.headers.get("origin") || "";
  await sendPasswordResetEmail(user.email, user.name, resetToken, origin);

  return NextResponse.json({ ok: true });
}
