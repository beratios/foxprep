import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const products = await prisma.product.findMany({
    where: { userId: session.userId },
    include: { inventory: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sku, title, photoUrl, condition } = await req.json();
  if (!sku || !title) return NextResponse.json({ error: "SKU and title are required." }, { status: 400 });

  const existing = await prisma.product.findUnique({ where: { userId_sku: { userId: session.userId, sku } } });
  if (existing) return NextResponse.json({ error: "You already have a product with this SKU." }, { status: 409 });

  const product = await prisma.product.create({
    data: { userId: session.userId, sku, title, photoUrl, condition: condition || "New" },
  });
  return NextResponse.json({ product });
}
