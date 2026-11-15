import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { money, CHANNEL_LABEL } from "@/lib/pricing";
import { StatusBadge } from "@/components/StatusBadge";
import { AddressCard } from "@/components/AddressCard";

export default async function Overview() {
  const user = await requireUser();
  const [orders, counts, products] = await Promise.all([
    prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.order.groupBy({ by: ["status"], where: { userId: user.id }, _count: true }),
    prisma.product.count({ where: { userId: user.id } }),
  ]);
  const c = (s: string[]) => counts.filter((x) => s.includes(x.status)).reduce((a, x) => a + x._count, 0);

  return (
    <div className="max-w-6xl">
      <h1 className="h-page">Hi {user.name.split(" ")[0]}</h1>
      <p className="mt-1 text-ink-soft">Here&apos;s what&apos;s happening with your inventory.</p>

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-4">
        {[
          ["Balance", money(user.balanceCents), "/dashboard/balance"],
          ["Waiting for supplier", c(["AWAITING_INBOUND"]), "/dashboard/orders?status=AWAITING_INBOUND"],
          ["At our warehouse", c(["RECEIVED", "IN_PREP"]), "/dashboard/orders?status=IN_PREP"],
          ["Products", products, "/dashboard/products"],
        ].map(([k, v, href]) => (
          <Link key={String(k)} href={String(href)} className="bg-white p-5 hover:bg-paper">
            <dt className="text-[13px] text-ink-soft">{k}</dt>
            <dd className="tnum wide mt-1 text-2xl font-extrabold">{v}</dd>
          </Link>
        ))}
      </dl>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent orders</h2>
            <Link href="/dashboard/orders/new" className="btn-fox btn-sm">New order</Link>
          </div>
          {orders.length === 0 ? (
            <div className="panel p-8 text-center">
              <p className="font-semibold">No orders yet</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">Create your first order to get our shipping address for your supplier.</p>
              <Link href="/dashboard/orders/new" className="btn-fox btn-sm mt-4">Start an order</Link>
            </div>
          ) : (
            <ul className="panel divide-y divide-line">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/dashboard/orders/${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 hover:bg-paper">
                    <span className="tnum font-bold">{o.ref}</span>
                    <span className="text-sm text-ink-soft">{CHANNEL_LABEL[o.channel]}, {o.units.toLocaleString()} units</span>
                    <span className="ml-auto flex items-center gap-4">
                      <span className="tnum text-sm font-semibold">{money(o.totalCents)}</span>
                      <StatusBadge status={o.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h2 className="mb-3 text-lg font-bold">Our address for your supplier</h2>
          <AddressCard customerCode={user.customerCode} name={user.company || user.name} />
          <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">Create an order before anything ships so we know what&apos;s coming. Each order adds its own number to the ATTN line.</p>
        </section>
      </div>
    </div>
  );
}
