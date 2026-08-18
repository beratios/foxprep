import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { calculateStorageFee, FREE_STORAGE_DAYS, DEFAULT_RATES } from "@/lib/pricing";

// Explicit admin action (not a background cron, on purpose — you want to
// review before money moves). Charges each customer's wallet for inventory
// that has been sitting for more than FREE_STORAGE_DAYS since it was last
// billed (or since it arrived, if never billed). Treats each unit of
// inventory as "1 box" for simplicity — if you later track boxes
// separately from units, swap that mapping here.
export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await prisma.pricingSetting.findUnique({ where: { id: "default" } });
  const rates = settings ?? DEFAULT_RATES;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - FREE_STORAGE_DAYS);

  const items = await prisma.inventoryItem.findMany({
    where: {
      quantity: { gt: 0 },
      receivedAt: { lte: cutoff },
      OR: [{ lastBilledAt: null }, { lastBilledAt: { lte: cutoff } }],
    },
    include: { product: true, user: true },
  });

  let totalCharged = 0;
  const results: { user: string; product: string; fee: number }[] = [];

  for (const item of items) {
    const fee = calculateStorageFee(item.quantity, rates);
    await prisma.$transaction([
      prisma.walletTransaction.create({
        data: {
          userId: item.userId,
          type: "STORAGE_FEE",
          amount: -fee,
          description: `Storage fee — ${item.product.title} (${item.quantity} units, past ${FREE_STORAGE_DAYS} free days)`,
        },
      }),
      prisma.inventoryItem.update({ where: { id: item.id }, data: { lastBilledAt: new Date() } }),
    ]);
    totalCharged += fee;
    results.push({ user: item.user.name, product: item.product.title, fee });
  }

  return NextResponse.json({ ok: true, itemsCharged: items.length, totalCharged, results });
}
