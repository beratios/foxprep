import Link from "next/link";
import type { OrderStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { STATUS } from "@/lib/status";
import { money } from "@/lib/pricing";
import { StatusBadge } from "@/components/StatusBadge";
import { getI18n } from "@/i18n/server";
import { L } from "@/i18n/labels";

export default async function Orders({ searchParams }: { searchParams: { status?: string } }) {
  const user = await requireUser();
  const { t } = await getI18n();
  const status = searchParams.status && searchParams.status in STATUS ? (searchParams.status as OrderStatus) : undefined;
  const orders = await prisma.order.findMany({
    where: { userId: user.id, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });
  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="h-page">{t("orders.orders", "Orders")}</h1>
        <Link href="/dashboard/orders/new" className="btn-fox btn-sm">{t("orders.new_order", "New order")}</Link>
      </div>
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        <Link href="/dashboard/orders" className={`btn-sm rounded-full border px-3 py-1.5 text-sm font-semibold ${!status ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>{t("orders.all", "All")}</Link>
        {(Object.keys(STATUS) as OrderStatus[]).map((s) => (
          <Link key={s} href={`/dashboard/orders?status=${s}`} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold ${status === s ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>
            {L.status(t, s)}
          </Link>
        ))}
      </div>
      {orders.length === 0 ? (
        <div className="panel mt-6 p-10 text-center">
          <p className="font-semibold">{status ? t("orders.noneIn", "No orders in \"{status}\"", { status: L.status(t, status) }) : t("ov.none", "No orders yet")}</p>
          <Link href="/dashboard/orders/new" className="btn-fox btn-sm mt-4">{t("orders.start_an_order", "Start an order")}</Link>
        </div>
      ) : (
        <div className="panel mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-[14.5px]">
            <thead className="border-b border-line text-left text-[13px] text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">{t("orders.order", "Order")}</th>
                <th className="px-4 py-3 font-medium">{t("orders.created", "Created")}</th>
                <th className="px-4 py-3 font-medium">{t("orders.destination", "Destination")}</th>
                <th className="px-4 py-3 text-end font-medium">{t("orders.units", "Units")}</th>
                <th className="px-4 py-3 text-end font-medium">{t("orders.total", "Total")}</th>
                <th className="px-4 py-3 font-medium">{t("orders.status", "Status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-paper">
                  <td className="px-4 py-3"><Link href={`/dashboard/orders/${o.id}`} className="tnum font-bold underline-offset-4 hover:underline">{o.ref}</Link></td>
                  <td className="tnum px-4 py-3 text-ink-soft">{o.createdAt.toLocaleDateString("en-CA")}</td>
                  <td className="px-4 py-3">{L.channel(t, o.channel)}</td>
                  <td className="tnum px-4 py-3 text-end">{o.units.toLocaleString()}</td>
                  <td className="tnum px-4 py-3 text-end font-semibold">{money(o.totalCents)}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
