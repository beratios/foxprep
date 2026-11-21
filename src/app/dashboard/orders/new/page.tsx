import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { decodeCart } from "@/lib/cartParams";
import { OrderCart } from "@/components/OrderCart";
import { getI18n } from "@/i18n/server";

export default async function NewOrder({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const { t } = await getI18n();
  const user = await requireUser();
  const products = await prisma.product.findMany({
    where: { userId: user.id },
    orderBy: { title: "asc" },
    select: { id: true, title: true, sku: true, asin: true, fnsku: true, provider: true },
  });
  const initial = decodeCart(searchParams);
  return (
    <div className="max-w-6xl">
      <h1 className="h-page">{t("new_page.new_inbound_order", "New inbound order")}</h1>
      <p className="mt-1 max-w-2xl text-ink-soft">{t("new_page.tell_us_what_your_supplier_is_sending_an", "Tell us what your supplier is sending and what to do with it. You'll get the shipping address as soon as it's paid.")}</p>
      <div className="mt-8">
        <OrderCart initial={initial} products={products} balanceCents={user.balanceCents} cardEnabled={Boolean(process.env.STRIPE_SECRET_KEY)} />
      </div>
    </div>
  );
}
