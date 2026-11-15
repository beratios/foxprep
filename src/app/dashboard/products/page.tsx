import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { AddProductForm } from "@/components/AddProductForm";
import { ActionButton } from "@/components/ActionButton";

export default async function Products() {
  const user = await requireUser();
  const products = await prisma.product.findMany({ where: { userId: user.id }, orderBy: { title: "asc" } });
  return (
    <div className="max-w-6xl">
      <h1 className="h-page">Products</h1>
      <p className="mt-1 max-w-2xl text-ink-soft">Synced from your connected stores, or added by hand. You can pick these when you build an order.</p>
      <div className="mt-8"><AddProductForm /></div>
      {products.length === 0 ? (
        <div className="panel mt-6 p-10 text-center">
          <p className="font-semibold">No products yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">Connect Amazon or Walmart to import your SKUs and FNSKUs automatically.</p>
          <Link href="/dashboard/stores" className="btn-ink btn-sm mt-4">Connect a store</Link>
        </div>
      ) : (
        <div className="panel mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-[14.5px]">
            <thead className="border-b border-line text-left text-[13px] text-ink-soft">
              <tr><th className="px-4 py-2.5 font-medium">Product</th><th className="px-4 py-2.5 font-medium">SKU</th><th className="px-4 py-2.5 font-medium">FNSKU / ASIN</th><th className="px-4 py-2.5 font-medium">Source</th><th className="px-4 py-2.5 text-right font-medium">At marketplace</th><th className="px-4 py-2.5 text-right font-medium">At FoxPrep</th><th className="px-4 py-2.5" /></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="max-w-[280px] truncate px-4 py-2.5 font-semibold">{p.title}</td>
                  <td className="tnum px-4 py-2.5">{p.sku}</td>
                  <td className="tnum px-4 py-2.5 text-ink-soft">{[p.fnsku, p.asin].filter(Boolean).join(" / ") || "—"}</td>
                  <td className="px-4 py-2.5">{p.provider === "AMAZON" ? "Amazon" : p.provider === "WALMART" ? "Walmart" : "Manual"}</td>
                  <td className="tnum px-4 py-2.5 text-right">{p.marketplaceQty ?? "—"}</td>
                  <td className="tnum px-4 py-2.5 text-right font-semibold">{p.warehouseQty}</td>
                  <td className="px-4 py-2.5 text-right">{!p.provider && <ActionButton endpoint={`/api/products/${p.id}`} method="DELETE" confirm="Delete this product?" className="text-sm font-semibold text-fox-dark hover:underline">Delete</ActionButton>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
