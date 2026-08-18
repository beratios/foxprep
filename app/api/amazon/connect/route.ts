import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { startAmazonOAuth } from "@/lib/amazon";

// TODO: replace this demo flow with a real redirect to Amazon's Login with
// Amazon (LWA) consent screen once AMAZON_LWA_CLIENT_ID is configured — see
// lib/amazon.ts. For now, this marks the account as connected immediately so
// the rest of the UI (order flow, settings page) can be built and tested.
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const redirectUrl = await startAmazonOAuth(session.userId);

  await prisma.user.update({
    where: { id: session.userId },
    data: { amazonConnected: true, amazonSellerId: "DEMO-SELLER-ID" },
  });

  return NextResponse.json({ ok: true, redirectUrl, demo: true });
}
