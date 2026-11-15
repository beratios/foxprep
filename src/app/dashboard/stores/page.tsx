import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { amazonConfigured } from "@/lib/amazon";
import { ActionButton } from "@/components/ActionButton";
import { WalmartForm } from "@/components/WalmartForm";

const MESSAGES: Record<string, string> = {
  amazon_setup: "Amazon connections aren't switched on yet. The FoxPrep team needs to add the SP-API app keys.",
  amazon_denied: "Amazon didn't finish the authorization. Try again and approve FoxPrep on the consent screen.",
  amazon_expired: "That connection link expired. Start again from this page.",
  amazon_token: "Amazon accepted the login but we couldn't get access. Try again in a minute.",
};

export default async function Stores({ searchParams }: { searchParams: { error?: string; connected?: string } }) {
  const user = await requireUser();
  const conns = await prisma.marketplaceConnection.findMany({ where: { userId: user.id }, include: { _count: { select: { products: true } } }, orderBy: { createdAt: "asc" } });
  const amazonReady = amazonConfigured();
  return (
    <div className="max-w-5xl">
      <h1 className="h-page">Connected stores</h1>
      <p className="mt-1 max-w-2xl text-ink-soft">We only read your listings and FBA inventory, so you can pick products in orders and see stock levels. We never change prices or listings.</p>
      {searchParams.error && <p role="alert" className="mt-6 rounded-md bg-fox-tint px-4 py-3 text-sm font-medium text-fox-dark">{MESSAGES[searchParams.error] || "Something went wrong."}</p>}
      {searchParams.connected && <p role="status" className="mt-6 rounded-md bg-ok/10 px-4 py-3 text-sm font-semibold text-ok">Store connected. Your products are importing.</p>}

      {conns.length > 0 && (
        <ul className="panel mt-8 divide-y divide-line">
          {conns.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="font-bold">{c.provider === "AMAZON" ? "Amazon" : "Walmart"} {c.region} <span className="font-normal text-ink-soft">{c.storeName || c.externalId}</span></div>
                <div className="text-[13px] text-ink-soft">
                  {c._count.products} products, {c.lastSyncAt ? `last synced ${c.lastSyncAt.toLocaleString("en-CA")}` : "not synced yet"}
                </div>
                {c.lastError && <div className="text-[13px] font-medium text-fox-dark">Last sync failed: {c.lastError}</div>}
              </div>
              <ActionButton endpoint={`/api/integrations/${c.id}`}>Sync now</ActionButton>
              <ActionButton endpoint={`/api/integrations/${c.id}`} method="DELETE" confirm="Disconnect this store? Products already imported stay." className="text-sm font-semibold text-fox-dark hover:underline">Disconnect</ActionButton>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="panel p-6">
          <h2 className="text-lg font-bold">Amazon Seller Central</h2>
          <p className="mt-1 text-[14.5px] text-ink-2">You&apos;ll sign in on Amazon and approve read access for FoxPrep. Imports SKUs, ASINs, FNSKUs and FBA stock.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="/api/integrations/amazon/start?region=CA" className={`btn-ink btn-sm ${amazonReady ? "" : "pointer-events-none opacity-50"}`} aria-disabled={!amazonReady}>Connect Amazon.ca</a>
            <a href="/api/integrations/amazon/start?region=US" className={`btn-ghost btn-sm ${amazonReady ? "" : "pointer-events-none opacity-50"}`} aria-disabled={!amazonReady}>Connect Amazon.com</a>
          </div>
          {!amazonReady && <p className="mt-3 text-[13px] text-ink-soft">Coming soon. Until then, add products by hand on the Products page.</p>}
        </section>
        <section className="panel p-6">
          <h2 className="text-lg font-bold">Walmart Marketplace</h2>
          <p className="mt-1 text-[14.5px] text-ink-2">Create API keys in Walmart Developer Portal (Seller Center, Settings, API Key Management) and paste them here.</p>
          <WalmartForm />
        </section>
      </div>
    </div>
  );
}
