import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { LabelPrinter } from "@/components/LabelPrinter";

export default async function Labels({ params }: { params: { id: string } }) {
  const o = await prisma.order.findUnique({ where: { id: params.id }, include: { items: { orderBy: { id: "asc" } } } });
  if (!o) notFound();
  return (
    <LabelPrinter
      orderId={o.id}
      orderRef={o.ref}
      items={o.items.map((i) => ({ id: i.id, title: i.title, sku: i.sku ?? "", fnsku: i.fnsku ?? "", quantity: i.quantity, receivedQty: i.receivedQty }))}
    />
  );
}
