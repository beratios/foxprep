import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { STATUS } from "@/lib/status";
import { money, CHANNEL_LABEL, BASIS_LABEL, rateLabel, type QuoteLine } from "@/lib/pricing";
import { StatusBadge } from "@/components/StatusBadge";
import { AdminOrderForm } from "@/components/AdminOrderForm";

export default async function AdminOrder({ params }: { params: { id: string } }) {
  const o = await prisma.order.findUnique({ where: { id: params.id }, include: { user: true, items: true, events: { orderBy: { createdAt: "desc" } } } });
  if (!o) notFound();
  const lines = o.lines as unknown as QuoteLine[];
  return (
    <div className="max-w-7xl">
      <Link href="/admin" className="text-sm font-semibold text-ink-soft hover:text-ink">All orders</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="h-page tnum">{o.ref}</h1>
        <StatusBadge status={o.status} />
      </div>
      <p className="mt-1 text-ink-soft">
        <span className="tnum font-bold text-fox-dark">{o.user.customerCode}</span> {o.user.company || o.user.name}, {o.user.email}{o.user.phone ? `, ${o.user.phone}` : ""}
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-lg font-bold">Work to do</h2>
            <p className="mb-3 text-ink-2">{CHANNEL_LABEL[o.channel]}, {o.units.toLocaleString()} units. Paid: {o.paidAt ? `${money(o.totalCents)} via ${o.paymentMethod === "WALLET" ? "balance" : "card"}` : "not yet"}.</p>
            <ul className="panel divide-y divide-line">
              {lines.map((l) => (
                <li key={l.code} className="flex items-center justify-between px-4 py-2.5 text-[14.5px]">
                  <span className="font-semibold">{l.name}</span>
                  <span className="tnum">{l.qty.toLocaleString()} {BASIS_LABEL[l.basis]}{l.qty === 1 ? "" : "s"} × {rateLabel(l.rateCents)} = <strong>{money(l.amountCents)}</strong></span>
                </li>
              ))}
            </ul>
          </section>
          {o.customerNotes && (
            <section>
              <h2 className="mb-2 text-lg font-bold">Customer instructions</h2>
              <p className="whitespace-pre-wrap rounded-lg bg-[#FFF3C4] p-4 text-[14.5px]">{o.customerNotes}</p>
            </section>
          )}
          <section className="grid gap-4 sm:grid-cols-2 text-[14.5px]">
            <div><div className="text-ink-soft">Supplier</div><div className="font-semibold">{o.supplierName || "Not given"}</div></div>
            <div><div className="text-ink-soft">Inbound tracking</div><div className="break-words font-semibold">{o.inboundTracking || "Not given"}</div></div>
          </section>
          <section>
            <h2 className="mb-3 text-lg font-bold">History</h2>
            <ul className="space-y-2 text-[14px]">
              {o.events.map((e) => (
                <li key={e.id}><span className="tnum text-ink-soft">{e.createdAt.toLocaleString("en-CA")}</span> <strong>{STATUS[e.status].label}</strong>{e.note ? `: ${e.note}` : ""}</li>
              ))}
            </ul>
          </section>
        </div>
        <aside>
          <AdminOrderForm
            order={{ id: o.id, status: o.status, outboundTracking: o.outboundTracking ?? "", adminNotes: o.adminNotes ?? "" }}
            items={o.items.map((i) => ({ id: i.id, title: i.title, sku: i.sku, quantity: i.quantity, receivedQty: i.receivedQty }))}
          />
        </aside>
      </div>
    </div>
  );
}
