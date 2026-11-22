import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";
import { newCustomerCode } from "@/lib/ids";

const Body = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  company: z.string().trim().optional(),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.string().trim().refine((v) => v.replace(/\D/g, "").length >= 7, "Enter a phone number"),
  password: z.string().min(8, "Use at least 8 characters for the password"),
  acceptTerms: z.literal("yes", { errorMap: () => ({ message: "Accept the Terms of Service to create an account." }) }),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { password, acceptTerms: _accepted, ...data } = parsed.data;
  if (await prisma.user.findUnique({ where: { email: data.email } }))
    return NextResponse.json({ error: "An account with this email already exists. Log in instead." }, { status: 409 });

  let customerCode = newCustomerCode();
  while (await prisma.user.findUnique({ where: { customerCode } })) customerCode = newCustomerCode();

  const user = await prisma.user.create({
    data: { ...data, company: data.company || null, phone: data.phone || null, customerCode, termsAcceptedAt: new Date(), passwordHash: await bcrypt.hash(password, 10) },
  });
  await setSessionCookie({ uid: user.id, role: user.role });
  return NextResponse.json({ ok: true });
}
