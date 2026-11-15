// Walmart Marketplace API — sellers paste their own Client ID / Secret from Walmart Developer Portal.
import { randomUUID } from "crypto";
import { prisma } from "./db";
import { decrypt } from "./crypto";

const BASE = "https://marketplace.walmartapis.com/v3";

function headers(region: string, extra: Record<string, string> = {}) {
  const h: Record<string, string> = {
    "WM_SVC.NAME": "FoxPrep",
    "WM_QOS.CORRELATION_ID": randomUUID(),
    Accept: "application/json",
    ...extra,
  };
  if (region === "CA") {
    h["WM_TENANT_ID"] = "WALMART.CA";
    h["WM_LOCALE_ID"] = "en_CA";
  }
  return h;
}

export async function walmartToken(clientId: string, clientSecret: string, region: string) {
  const res = await fetch(`${BASE}/token`, {
    method: "POST",
    headers: headers(region, {
      Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    }),
    body: "grant_type=client_credentials",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) throw new Error("Walmart rejected these API keys. Check the Client ID and Secret.");
  return json.access_token as string;
}

interface WmItem {
  sku: string;
  productName?: string;
  upc?: string;
  gtin?: string;
}

export async function syncWalmart(connectionId: string) {
  const conn = await prisma.marketplaceConnection.findUniqueOrThrow({ where: { id: connectionId } });
  const region = conn.region || "US";
  try {
    const { clientSecret } = JSON.parse(decrypt(conn.secret)) as { clientSecret: string };
    const token = await walmartToken(conn.externalId, clientSecret, region);
    let count = 0;
    let cursor: string | undefined = "*";
    while (cursor) {
      const q: URLSearchParams = new URLSearchParams({ limit: "200", nextCursor: cursor });
      const res: Response = await fetch(`${BASE}/items?${q}`, { headers: headers(region, { "WM_SEC.ACCESS_TOKEN": token }) });
      const json: { ItemResponse?: WmItem[]; nextCursor?: string; errors?: { description?: string }[] } = await res.json();
      if (!res.ok) throw new Error(json?.errors?.[0]?.description || `Walmart ${res.status}`);
      const items: WmItem[] = json.ItemResponse || [];
      for (const it of items) {
        await prisma.product.upsert({
          where: { userId_sku: { userId: conn.userId, sku: it.sku } },
          create: { userId: conn.userId, connectionId: conn.id, provider: "WALMART", sku: it.sku, title: it.productName || it.sku },
          update: { title: it.productName || it.sku, connectionId: conn.id },
        });
        count++;
      }
      cursor = items.length ? json.nextCursor : undefined;
    }
    await prisma.marketplaceConnection.update({ where: { id: conn.id }, data: { lastSyncAt: new Date(), lastError: null } });
    return count;
  } catch (e) {
    await prisma.marketplaceConnection.update({ where: { id: conn.id }, data: { lastError: (e as Error).message } });
    throw e;
  }
}
