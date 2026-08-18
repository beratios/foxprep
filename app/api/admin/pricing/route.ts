import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const settings =
    (await prisma.pricingSetting.findUnique({ where: { id: "default" } })) ??
    (await prisma.pricingSetting.create({ data: { id: "default" } }));

  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const settings = await prisma.pricingSetting.upsert({
    where: { id: "default" },
    update: body,
    create: { id: "default", ...body },
  });

  return NextResponse.json({ settings });
}
