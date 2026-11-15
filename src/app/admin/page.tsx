import Link from "next/link";
import type { OrderStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { STATUS } from "@/lib/status";
import { money } from "@/lib/pricing";
import { StatusBadge } from "@/components/StatusBadge";

export default async function AdminOrders({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  const status = searchParams.status && searchParams.status in STATUS ? (searchParams.status as OrderStatus) : undefined;
  const q = searchParams.q?.trim();
  const [orders, counts, revenue] = await Promise.all([
    prisma.order.findMany({
      where: {
        ...(status ? { status } : { status: { notIn: ["COMPLETED", "CANCELLED"] } }),
        ...(q ? { OR: [{ ref: { contains: q, mode: "insensitive" } }, { user: { customerCode: { contains: q, mode: "insensitive" } } }, { user: { email: { contains: q, mode: "insensitive" } } }] } : {}),
      },
      include: { user: { select: { name: true, company: true, customerCode: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
    prisma.order.aggregate({ _sum: { subtotalCents: true }, where: { paidAt: { gte: new Date(Date.now() - 30 * 864e5) }, status: { not: "CANCELLED" } } }),
  ]);
  const count = (s: OrderStatus) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <div className="max-w-7xl">
      <h1 className="h-page">Orders</h1>
      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-5">
        {(["AWAITING_INBOUND", "RECEIVED", "IN_PREP", "SHIPPED"] as OrderStatus[]).map((s) => (
          <Link key={s} href={`/admin?status=${s}`} className="bg-white p-4 hover:bg-paper">
            <dt className="text-[13px] text-ink-soft">{STATUS[s].label}</dt>
            <dd className="tnum wide text-2xl font-extrabold">{count(s)}</dd>
          </Link>
        ))}
        <div className="bg-white p-4">
          <dt className="text-[13px] text-ink-soft">Revenue, last 30 days</dt>
          <dd className="tnum wide text-2xl font-extrabold">{money(revenue._sum.subtotalCents ?? 0)}</dd>
        </div>
      </dl>

      <form className="mt-6 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Order ref, customer code or email" className="field max-w-sm" aria-label="Search" />
        <select name="status" defaultValue={status ?? ""} className="field w-auto" aria-label="Status">
          <option value="">Open orders</option>
          {(Object.keys(STATUS) as OrderStatus[]).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
        </select>
        <button className="btn-ink btn-sm">Filter</button>
      </form>

      <div className="panel mt-4 overflow-x-auto">
        <table className="w-full min-w-[860px] text-[14.5px]">
          <thead className="border-b border-line text-left text-[13px] text-ink-soft">
            <tr><th className="px-4 py-2.5 font-medium">Order</th><th className="px-4 py-2.5 font-medium">Customer</th><th className="px-4 py-2.5 font-medium">Channel</th><th className="px-4 py-2.5 text-right font-medium">Units</th><th className="px-4 py-2.5 text-right font-medium">Total</th><th className="px-4 py-2.5 font-medium">Created</th><th className="px-4 py-2.5 font-medium">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-paper">
                <td className="px-4 py-2.5"><Link href={`/admin/orders/${o.id}`} className="tnum font-bold hover:underline">{o.ref}</Link></td>
                <td className="px-4 py-2.5"><span className="tnum font-semibold text-fox-dark">{o.user.customerCode}</span> {o.user.company || o.user.name}</td>
                <td className="px-4 py-2.5">{o.channel}</td>
                <td className="tnum px-4 py-2.5 text-right">{o.units.toLocaleString()}</td>
                <td className="tnum px-4 py-2.5 text-right font-semibold">{money(o.totalCents)}</td>
                <td className="tnum px-4 py-2.5 text-ink-soft">{o.createdAt.toLocaleDateString("en-CA")}</td>
                <td className="px-4 py-2.5"><StatusBadge status={o.status} /></td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-ink-soft">No orders match this filter.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
