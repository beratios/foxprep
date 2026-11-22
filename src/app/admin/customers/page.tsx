import { WaLink } from "@/components/WaLink";
import { prisma } from "@/lib/db";
import { money } from "@/lib/pricing";
import { AdjustBalance } from "@/components/AdjustBalance";

export default async function Customers() {
  const users = await prisma.user.findMany({ where: { role: "CUSTOMER" }, orderBy: { createdAt: "desc" }, include: { _count: { select: { orders: true, connections: true } } } });
  return (
    <div className="max-w-7xl">
      <h1 className="h-page">Customers</h1>
      <div className="panel mt-6 overflow-x-auto">
        <table className="w-full min-w-[900px] text-[14.5px]">
          <thead className="border-b border-line text-left text-[13px] text-ink-soft">
            <tr><th className="px-4 py-2.5 font-medium">Code</th><th className="px-4 py-2.5 font-medium">Customer</th><th className="px-4 py-2.5 font-medium">Joined</th><th className="px-4 py-2.5 text-right font-medium">Orders</th><th className="px-4 py-2.5 text-right font-medium">Stores</th><th className="px-4 py-2.5 text-right font-medium">Balance</th><th className="px-4 py-2.5 font-medium">Adjust balance</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="tnum px-4 py-2.5 font-bold text-fox-dark">{u.customerCode}</td>
                <td className="px-4 py-2.5"><div className="font-semibold">{u.company || u.name}</div><div className="text-[13px] text-ink-soft">{u.email}</div>{u.phone && <WaLink phone={u.phone} className="text-[13px]" />}</td>
                <td className="tnum px-4 py-2.5 text-ink-soft">{u.createdAt.toLocaleDateString("en-CA")}</td>
                <td className="tnum px-4 py-2.5 text-right">{u._count.orders}</td>
                <td className="tnum px-4 py-2.5 text-right">{u._count.connections}</td>
                <td className="tnum px-4 py-2.5 text-right font-semibold">{money(u.balanceCents)}</td>
                <td className="px-4 py-2.5"><AdjustBalance userId={u.id} /></td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-ink-soft">No customers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
