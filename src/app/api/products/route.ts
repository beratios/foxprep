import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const Body = z.object({ title: z.string().trim().min(1), sku: z.string().trim().min(1), asin: z.string().trim().optional(), fnsku: z.string().trim().optional() });

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Log in again." }, { status: 401 });
  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: "Enter a product name and SKU." }, { status: 400 });
  const { asin, fnsku, ...rest } = p.data;
  const product = await prisma.product.upsert({
    where: { userId_sku: { userId: s.uid, sku: rest.sku } },
    create: { ...rest, asin: asin || null, fnsku: fnsku || null, userId: s.uid },
    update: { title: rest.title, asin: asin || null, fnsku: fnsku || null },
  });
  return NextResponse.json({ product });
}
