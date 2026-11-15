import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { exchangeCode, storeName, syncAmazon } from "@/lib/amazon";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const back = (q: string) => NextResponse.redirect(new URL(`/dashboard/stores?${q}`, req.url));
  const code = url.searchParams.get("spapi_oauth_code");
  const sellerId = url.searchParams.get("selling_partner_id");
  const state = url.searchParams.get("state");
  if (!code || !sellerId || !state) return back("error=amazon_denied");

  let uid: string, region: string;
  try {
    const { payload } = await jwtVerify(state, new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me"));
    uid = String(payload.uid);
    region = String(payload.region);
  } catch {
    return back("error=amazon_expired");
  }

  try {
    const tokens = await exchangeCode(code);
    if (!tokens.refresh_token) throw new Error("no refresh token");
    const name = await storeName(tokens.refresh_token);
    const conn = await prisma.marketplaceConnection.upsert({
      where: { userId_provider_externalId: { userId: uid, provider: "AMAZON", externalId: sellerId } },
      create: { userId: uid, provider: "AMAZON", externalId: sellerId, region, storeName: name, secret: encrypt(tokens.refresh_token) },
      update: { region, storeName: name, secret: encrypt(tokens.refresh_token), lastError: null },
    });
    await syncAmazon(conn.id).catch(() => {});
    return back("connected=amazon");
  } catch {
    return back("error=amazon_token");
  }
}
