import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** Statuses in which a customer may still change a product line (before we start labeling). */
const CUSTOMER_EDITABLE = ["AWAITING_PAYMENT", "AWAITING_INBOUND", "RECEIVED"];

const Body = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  sku: z.string().trim().max(80).optional(),
  fnsku: z.string().trim().toUpperCase().max(20).optional(),
  quantity: z.number().int().min(1).max(100000).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string; itemId: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Log in again." }, { status: 401 });
  const admin = s.role === "ADMIN";
  const item = await prisma.orderItem.findFirst({
    where: { id: params.itemId, orderId: params.id, ...(admin ? {} : { order: { userId: s.uid } }) },
    include: { order: { select: { id: true, status: true } } },
  });
  if (!item) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!admin && !CUSTOMER_EDITABLE.includes(item.order.status)) return NextResponse.json({ error: "locked" }, { status: 403 });

  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const b = p.data;
  if (b.fnsku && !/^[A-Z0-9]{10}$/.test(b.fnsku)) return NextResponse.json({ error: "fnsku" }, { status: 400 });

  const changes: string[] = [];
  if (b.title !== undefined && b.title !== item.title) changes.push(`name "${b.title}"`);
  if (b.fnsku !== undefined && (b.fnsku || null) !== item.fnsku) changes.push(`FNSKU ${b.fnsku || "removed"}`);
  if (b.sku !== undefined && (b.sku || null) !== item.sku) changes.push(`SKU ${b.sku || "removed"}`);
  if (b.quantity !== undefined && b.quantity !== item.quantity) changes.push(`quantity ${item.quantity} → ${b.quantity}`);
  if (!changes.length) return NextResponse.json({ ok: true });

  await prisma.$transaction([
    prisma.orderItem.update({
      where: { id: item.id },
      data: {
        ...(b.title !== undefined && { title: b.title }),
        ...(b.sku !== undefined && { sku: b.sku || null }),
        ...(b.fnsku !== undefined && { fnsku: b.fnsku || null }),
        ...(b.quantity !== undefined && { quantity: b.quantity }),
      },
    }),
    prisma.orderEvent.create({
      data: { orderId: item.order.id, status: item.order.status, note: `${admin ? "FoxPrep" : "Customer"} edited ${item.title}: ${changes.join(", ")}` },
    }),
  ]);
  return NextResponse.json({ ok: true });
}
