import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { confirmSession } from "@/lib/orders";
import { STATUS, FLOW } from "@/lib/status";
import { money, rateLabel, HST_RATE, type QuoteLine } from "@/lib/pricing";
import { StatusBadge } from "@/components/StatusBadge";
import { AddressCard } from "@/components/AddressCard";
import { ActionButton } from "@/components/ActionButton";
import { PhotoGallery } from "@/components/PhotoUploader";
import { getI18n } from "@/i18n/server";
import { L } from "@/i18n/labels";

export default async function OrderPage({ params, searchParams }: { params: { id: string }; searchParams: { session_id?: string; placed?: string } }) {
  const user = await requireUser();
  const { t } = await getI18n();
  if (searchParams.session_id) await confirmSession(searchParams.session_id);
  const order = await prisma.order.findFirst({
    where: { id: params.id, userId: user.id },
    include: { items: true, photos: { orderBy: { createdAt: "asc" } }, events: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();
  const lines = order.lines as unknown as QuoteLine[];
  const stepIndex = FLOW.indexOf(order.status);
  const fresh = (searchParams.placed || searchParams.session_id) && order.paidAt;
  const cardEnabled = Boolean(process.env.STRIPE_SECRET_KEY);

  return (
    <div className="max-w-6xl">
      <Link href="/dashboard/orders" className="text-sm font-semibold text-ink-soft hover:text-ink">{t("order.all_orders", "All orders")}</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="h-page tnum">{order.ref}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-ink-soft">{t("order.sub", "{channel}, {units}, created {date}", { channel: L.channel(t, order.channel), units: L.qty(t, order.units, "unit"), date: order.createdAt.toLocaleDateString("en-CA") })}</p>

      {fresh && (
        <div role="status" className="mt-6 rounded-lg border-2 border-ok bg-ok/5 p-4">
          <p className="font-bold text-ok">{t("order.order_paid_send_the_address_below_to_you", "Order paid. Send the address below to your supplier.")}</p>
          <p className="mt-1 text-sm text-ink-2">{t("order.we_ll_email_you_when_the_first_carton_ar", "We'll email you when the first carton arrives.")}</p>
        </div>
      )}

      {order.status !== "CANCELLED" && (
        <ol className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label={t("order.order_progress", "Order progress")}>
          {FLOW.map((s, i) => (
            <li key={s} className="text-[12.5px]">
              <div className={`mb-1.5 h-1.5 rounded-full ${i <= stepIndex ? "bg-fox" : "bg-line"}`} />
              <span className={i === stepIndex ? "font-bold text-ink" : "text-ink-soft"}>{L.status(t, s)}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          {order.status === "AWAITING_PAYMENT" && (
            <section className="rounded-lg border-2 border-fox bg-fox-tint/40 p-5">
              <h2 className="font-bold">{t("order.payToGet", "Pay {amount} to get the shipping address", { amount: money(order.totalCents) })}</h2>
              <p className="mt-1 text-sm text-ink-2">{t("order.yourBalance", "Your balance is {amount}.", { amount: money(user.balanceCents) })}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <ActionButton endpoint={`/api/orders/${order.id}/pay`} body={{ method: "WALLET" }} className="btn-fox btn-sm">{t("order.pay_from_balance", "Pay from balance")}</ActionButton>
                {cardEnabled && <ActionButton endpoint={`/api/orders/${order.id}/pay`} body={{ method: "STRIPE" }} className="btn-ghost btn-sm">{t("order.pay_by_card", "Pay by card")}</ActionButton>}
                <Link href="/dashboard/balance" className="btn-ghost btn-sm">{t("order.top_up_balance", "Top up balance")}</Link>
              </div>
            </section>
          )}

          {order.outboundTracking && ["SHIPPED", "COMPLETED"].includes(order.status) && (
            <section className="rounded-lg border-2 border-ok bg-ok/5 p-5">
              <h2 className="font-bold text-ok">{t("order.shipped", "Shipped")}</h2>
              <p className="mt-1 text-sm text-ink-2">{t("order.tracking_or_shipment_id", "Tracking or shipment ID")}</p>
              <p className="tnum mt-1 break-words text-lg font-bold">{order.outboundTracking}</p>
            </section>
          )}

          <PhotoGallery photos={order.photos.map((p) => ({ id: p.id, url: p.url, kind: p.kind }))} />

          <section>
            <h2 className="mb-3 text-lg font-bold">{t("order.services_and_charges", "Services and charges")}</h2>
            <div className="panel overflow-x-auto">
              <table className="w-full min-w-[520px] text-[14.5px]">
                <thead className="border-b border-line text-left text-[13px] text-ink-soft">
                  <tr><th className="px-4 py-2.5 font-medium">{t("order.service", "Service")}</th><th className="px-4 py-2.5 text-end font-medium">{t("order.qty", "Qty")}</th><th className="px-4 py-2.5 text-end font-medium">{t("order.rate", "Rate")}</th><th className="px-4 py-2.5 text-end font-medium">{t("order.amount", "Amount")}</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {lines.map((l) => (
                    <tr key={l.code}>
                      <td className="px-4 py-2.5 font-medium">{L.svcName(t, l.code)}</td>
                      <td className="tnum px-4 py-2.5 text-end">{L.qty(t, l.qty, l.basis)}</td>
                      <td className="tnum px-4 py-2.5 text-end">{rateLabel(l.rateCents)}</td>
                      <td className="tnum px-4 py-2.5 text-end font-semibold">{money(l.amountCents)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="tnum border-t-2 border-ink text-end">
                  <tr><td colSpan={3} className="px-4 pt-3">{t("order.subtotal", "Subtotal")}</td><td className="px-4 pt-3">{money(order.subtotalCents)}</td></tr>
                  <tr className="text-ink-soft"><td colSpan={3} className="px-4">{t("sum.hst", "HST")} {Math.round(HST_RATE * 100)}%</td><td className="px-4">{money(order.taxCents)}</td></tr>
                  <tr className="text-lg font-extrabold"><td colSpan={3} className="px-4 pb-3">{t("order.total", "Total")}</td><td className="px-4 pb-3">{money(order.totalCents)}</td></tr>
                </tfoot>
              </table>
            </div>
            {order.paidAt && (
              <p className="mt-2 text-[13px] text-ink-soft">
                {order.paymentMethod === "WALLET"
                  ? t("order.paidBalance", "Paid {date} from balance.", { date: order.paidAt.toLocaleString("en-CA") })
                  : t("order.paidCard", "Paid {date} by card.", { date: order.paidAt.toLocaleString("en-CA") })}
              </p>
            )}
          </section>

          {order.items.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-bold">{t("order.products", "Products")}</h2>
              <ul className="panel divide-y divide-line">
                {order.items.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{i.title}</div>
                      <div className="tnum text-[12.5px] text-ink-soft">{[i.sku && `SKU ${i.sku}`, i.fnsku && `FNSKU ${i.fnsku}`, i.asin && `ASIN ${i.asin}`].filter(Boolean).join(", ")}</div>
                      {i.url && <a href={i.url} target="_blank" rel="noopener noreferrer" className="block truncate text-[12.5px] underline">{i.url}</a>}
                    </div>
                    <div className="tnum text-end text-sm">
                      <div className="font-semibold">{t("order.expected", "{n} expected", { n: i.quantity.toLocaleString() })}</div>
                      {i.receivedQty != null && <div className={i.receivedQty === i.quantity ? "text-ok" : "text-fox-dark"}>{t("order.received", "{n} received", { n: i.receivedQty.toLocaleString() })}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="mb-2 text-lg font-bold">{t("order.shipment_details", "Shipment details")}</h2>
              <dl className="space-y-2 text-[14.5px]">
                <div><dt className="text-ink-soft">{t("order.supplier", "Supplier")}</dt><dd className="font-medium">{order.supplierName || t("order.notGiven", "Not given")}</dd></div>
                <div><dt className="text-ink-soft">{t("order.inbound_tracking", "Inbound tracking")}</dt><dd className="break-words font-medium">{order.inboundTracking || t("order.notGiven", "Not given")}</dd></div>
                {order.outboundTracking && <div><dt className="text-ink-soft">{t("order.outbound_tracking", "Outbound tracking")}</dt><dd className="break-words font-medium">{order.outboundTracking}</dd></div>}
              </dl>
            </div>
            {order.customerNotes && (
              <div>
                <h2 className="mb-2 text-lg font-bold">{t("order.your_instructions", "Your instructions")}</h2>
                <p className="whitespace-pre-wrap text-[14.5px] text-ink-2">{order.customerNotes}</p>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">{t("order.history", "History")}</h2>
            <ol className="space-y-3 border-l-2 border-line pl-5">
              {order.events.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-ink" aria-hidden />
                  <div className="text-[14.5px] font-semibold">{L.status(t, e.status)}{e.note ? <span className="font-normal text-ink-2">: {e.note}</span> : null}</div>
                  <div className="tnum text-[12.5px] text-ink-soft">{e.createdAt.toLocaleString("en-CA")}</div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-4">
          {order.paidAt && order.status !== "CANCELLED" ? (
            <>
              <h2 className="text-lg font-bold">{t("order.shipping_address_for_your_supplier", "Shipping address for your supplier")}</h2>
              <AddressCard customerCode={user.customerCode} orderRef={order.ref} name={user.company || user.name} hasCompany={!!user.company} />
            </>
          ) : order.status !== "CANCELLED" ? (
            <div className="panel p-5 text-[14.5px] text-ink-2">{t("order.the_shipping_address_appears_here_once_t", "The shipping address appears here once the order is paid.")}</div>
          ) : null}
          <a href={`/dashboard/support?order=${order.id}`} className="btn-ghost btn-sm w-full">{t("order.ask_about_this_order", "Ask about this order")}</a>
          {["AWAITING_PAYMENT", "AWAITING_INBOUND"].includes(order.status) && (
            <div className="pt-2">
              <ActionButton endpoint={`/api/orders/${order.id}/cancel`} confirm={order.paidAt ? t("order.cancelConfirmPaid", "Cancel this order? The full amount goes back to your balance.") : t("order.cancelConfirm", "Cancel this order?")} className="text-sm font-semibold text-fox-dark hover:underline">
                {order.paidAt ? t("order.cancelRefund", "Cancel order and refund to balance") : t("order.cancel", "Cancel order")}
              </ActionButton>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
