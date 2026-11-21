import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const Body = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  company: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
});

export async function PATCH(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Log in again." }, { status: 401 });
  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: p.error.issues[0].message }, { status: 400 });
  await prisma.user.update({
    where: { id: s.uid },
    data: { name: p.data.name, company: p.data.company || null, phone: p.data.phone || null },
  });
  return NextResponse.json({ ok: true });
}
