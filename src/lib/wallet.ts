import { Prisma, TxType } from "@/generated/prisma/client";
import { prisma } from "./db";

type Tx = Prisma.TransactionClient;

/**
 * Atomically move money in/out of a customer's balance and write a ledger row.
 * Debits fail (return null) if the balance would go negative.
 */
export async function postTransaction(
  tx: Tx,
  args: { userId: string; type: TxType; amountCents: number; description: string; orderId?: string; stripeSession?: string },
) {
  const { userId, amountCents } = args;
  const updated =
    amountCents < 0
      ? await tx.user.updateMany({
          where: { id: userId, balanceCents: { gte: -amountCents } },
          data: { balanceCents: { increment: amountCents } },
        })
      : await tx.user.updateMany({ where: { id: userId }, data: { balanceCents: { increment: amountCents } } });
  if (updated.count === 0) return null;
  const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { balanceCents: true } });
  return tx.walletTransaction.create({
    data: { ...args, balanceAfterCents: user.balanceCents },
  });
}

export async function creditTopUp(userId: string, amountCents: number, stripeSession: string) {
  return prisma.$transaction(async (tx) => {
    const exists = await tx.walletTransaction.findUnique({ where: { stripeSession } });
    if (exists) return exists; // webhook retries are idempotent
    return postTransaction(tx, { userId, type: "TOPUP", amountCents, description: "Balance top-up (card)", stripeSession });
  });
}
