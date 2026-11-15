import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { confirmSession } from "@/lib/orders";
import { money } from "@/lib/pricing";
import { TopUpForm } from "@/components/TopUpForm";

const TYPE_LABEL = { TOPUP: "Top-up", CHARGE: "Order", REFUND: "Refund", ADJUSTMENT: "Adjustment" } as const;

export default async function Balance({ searchParams }: { searchParams: { session_id?: string } }) {
  if (searchParams.session_id) await confirmSession(searchParams.session_id);
  const user = await requireUser();
  const txs = await prisma.walletTransaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div className="max-w-5xl">
      <h1 className="h-page">Balance</h1>
      {searchParams.session_id && <p role="status" className="mt-4 rounded-md bg-ok/10 px-4 py-3 font-semibold text-ok">Payment received. Your balance is updated.</p>}
      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_1.2fr]">
        <div className="rounded-lg bg-ink p-6 text-white">
          <div className="text-sm text-white/70">Available balance</div>
          <div className="tnum wide mt-1 text-4xl font-black">{money(user.balanceCents)}</div>
          <p className="mt-4 text-sm leading-relaxed text-white/70">Orders paid from your balance are confirmed instantly. Refunds for cancelled orders come back here.</p>
        </div>
        <div className="panel p-6">
          <h2 className="font-bold">Add funds</h2>
          <TopUpForm enabled={Boolean(process.env.STRIPE_SECRET_KEY)} />
        </div>
      </div>
      <h2 className="mb-3 mt-12 text-lg font-bold">History</h2>
      {txs.length === 0 ? (
        <p className="panel p-6 text-ink-soft">No transactions yet. Top-ups, order charges and refunds will appear here.</p>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[560px] text-[14.5px]">
            <thead className="border-b border-line text-left text-[13px] text-ink-soft">
              <tr><th className="px-4 py-2.5 font-medium">Date</th><th className="px-4 py-2.5 font-medium">Type</th><th className="px-4 py-2.5 font-medium">Description</th><th className="px-4 py-2.5 text-right font-medium">Amount</th><th className="px-4 py-2.5 text-right font-medium">Balance</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {txs.map((t) => (
                <tr key={t.id}>
                  <td className="tnum px-4 py-2.5 text-ink-soft">{t.createdAt.toLocaleDateString("en-CA")}</td>
                  <td className="px-4 py-2.5">{TYPE_LABEL[t.type]}</td>
                  <td className="px-4 py-2.5">{t.description}</td>
                  <td className={`tnum px-4 py-2.5 text-right font-semibold ${t.amountCents > 0 ? "text-ok" : ""}`}>{t.amountCents > 0 ? "+" : "−"}{money(Math.abs(t.amountCents))}</td>
                  <td className="tnum px-4 py-2.5 text-right text-ink-soft">{money(t.balanceAfterCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
