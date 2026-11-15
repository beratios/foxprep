// Amazon Selling Partner API (North America). LWA tokens only — SigV4 is no longer required.
import { prisma } from "./db";
import { decrypt } from "./crypto";

export const MARKETPLACES = {
  CA: { id: "A2EUQ1WTGCTBG2", central: "https://sellercentral.amazon.ca" },
  US: { id: "ATVPDKIKX0DER", central: "https://sellercentral.amazon.com" },
} as const;
export type AmazonRegion = keyof typeof MARKETPLACES;

const ENDPOINT = "https://sellingpartnerapi-na.amazon.com";

export const amazonConfigured = () =>
  Boolean(process.env.AMAZON_SPAPI_APP_ID && process.env.AMAZON_LWA_CLIENT_ID && process.env.AMAZON_LWA_CLIENT_SECRET);

export function authorizeUrl(region: AmazonRegion, state: string) {
  const u = new URL("/apps/authorize/consent", MARKETPLACES[region].central);
  u.searchParams.set("application_id", process.env.AMAZON_SPAPI_APP_ID!);
  u.searchParams.set("state", state);
  if (process.env.AMAZON_SPAPI_DRAFT === "true") u.searchParams.set("version", "beta");
  return u.toString();
}

async function lwa(body: Record<string, string>) {
  const res = await fetch("https://api.amazon.com/auth/o2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      ...body,
      client_id: process.env.AMAZON_LWA_CLIENT_ID!,
      client_secret: process.env.AMAZON_LWA_CLIENT_SECRET!,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Amazon login failed: ${json.error_description || json.error || res.status}`);
  return json as { access_token: string; refresh_token?: string; expires_in: number };
}

export const exchangeCode = (code: string) => lwa({ grant_type: "authorization_code", code });
const accessToken = async (refresh: string) => (await lwa({ grant_type: "refresh_token", refresh_token: refresh })).access_token;

async function sp<T>(token: string, path: string): Promise<T> {
  const res = await fetch(ENDPOINT + path, { headers: { "x-amz-access-token": token, Accept: "application/json" } });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.errors?.[0]?.message || `SP-API ${res.status}`);
  return json as T;
}

interface InvSummary {
  asin?: string;
  fnSku?: string;
  sellerSku: string;
  productName?: string;
  totalQuantity?: number;
}

export async function storeName(refresh: string): Promise<string | null> {
  try {
    const t = await accessToken(refresh);
    const r = await sp<{ payload: { participation: unknown; storeName?: string; marketplace: { name: string } }[] }>(
      t,
      "/sellers/v1/marketplaceParticipations",
    );
    return r.payload.find((p) => p.storeName)?.storeName ?? null;
  } catch {
    return null;
  }
}

/** Pull FBA inventory (SKU, ASIN, FNSKU, qty at Amazon) into Product rows. */
export async function syncAmazon(connectionId: string) {
  const conn = await prisma.marketplaceConnection.findUniqueOrThrow({ where: { id: connectionId } });
  const region = (conn.region as AmazonRegion) || "CA";
  const mp = MARKETPLACES[region].id;
  try {
    const token = await accessToken(decrypt(conn.secret));
    let next: string | undefined;
    let count = 0;
    do {
      const q = new URLSearchParams({ details: "true", granularityType: "Marketplace", granularityId: mp, marketplaceIds: mp });
      if (next) q.set("nextToken", next);
      const r = await sp<{ payload: { inventorySummaries: InvSummary[] }; pagination?: { nextToken?: string } }>(
        token,
        `/fba/inventory/v1/summaries?${q}`,
      );
      for (const s of r.payload.inventorySummaries) {
        await prisma.product.upsert({
          where: { userId_sku: { userId: conn.userId, sku: s.sellerSku } },
          create: {
            userId: conn.userId,
            connectionId: conn.id,
            provider: "AMAZON",
            sku: s.sellerSku,
            asin: s.asin,
            fnsku: s.fnSku,
            title: s.productName || s.sellerSku,
            marketplaceQty: s.totalQuantity ?? 0,
          },
          update: { asin: s.asin, fnsku: s.fnSku, title: s.productName || s.sellerSku, marketplaceQty: s.totalQuantity ?? 0, connectionId: conn.id },
        });
        count++;
      }
      next = r.pagination?.nextToken;
    } while (next);
    await prisma.marketplaceConnection.update({ where: { id: conn.id }, data: { lastSyncAt: new Date(), lastError: null } });
    return count;
  } catch (e) {
    await prisma.marketplaceConnection.update({ where: { id: conn.id }, data: { lastError: (e as Error).message } });
    throw e;
  }
}
