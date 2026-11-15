import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { syncAmazon } from "@/lib/amazon";
import { syncWalmart } from "@/lib/walmart";

async function own(id: string) {
  const s = await getSession();
  if (!s) return null;
  return prisma.marketplaceConnection.findFirst({ where: { id, userId: s.uid } });
}

/** Sync products now */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const conn = await own(params.id);
  if (!conn) return NextResponse.json({ error: "Store not found." }, { status: 404 });
  try {
    const count = conn.provider === "AMAZON" ? await syncAmazon(conn.id) : await syncWalmart(conn.id);
    return NextResponse.json({ ok: true, count });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const conn = await own(params.id);
  if (!conn) return NextResponse.json({ error: "Store not found." }, { status: 404 });
  await prisma.marketplaceConnection.delete({ where: { id: conn.id } });
  return NextResponse.json({ ok: true });
}
