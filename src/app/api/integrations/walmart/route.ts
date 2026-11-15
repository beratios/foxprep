import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { syncWalmart, walmartToken } from "@/lib/walmart";

const Body = z.object({ clientId: z.string().trim().min(5), clientSecret: z.string().trim().min(5), region: z.enum(["US", "CA"]), storeName: z.string().trim().optional() });

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Log in again." }, { status: 401 });
  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: "Paste both the Client ID and the Client Secret." }, { status: 400 });
  try {
    await walmartToken(p.data.clientId, p.data.clientSecret, p.data.region);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  const conn = await prisma.marketplaceConnection.upsert({
    where: { userId_provider_externalId: { userId: session.uid, provider: "WALMART", externalId: p.data.clientId } },
    create: { userId: session.uid, provider: "WALMART", externalId: p.data.clientId, region: p.data.region, storeName: p.data.storeName || null, secret: encrypt(JSON.stringify({ clientSecret: p.data.clientSecret })) },
    update: { region: p.data.region, storeName: p.data.storeName || null, secret: encrypt(JSON.stringify({ clientSecret: p.data.clientSecret })), lastError: null },
  });
  const count = await syncWalmart(conn.id).catch(() => 0);
  return NextResponse.json({ ok: true, count });
}
