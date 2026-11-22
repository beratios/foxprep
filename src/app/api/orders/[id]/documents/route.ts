import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Vercel functions accept ~4.5 MB per request, so the browser sends one file per request
const MAX_BYTES = 4 * 1024 * 1024;
const KINDS = ["UNIT_LABELS", "BOX_LABELS", "CARRIER_LABELS", "SHIPPING_LABELS", "OTHER"] as const;
const OK_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

async function access(orderId: string) {
  const s = await getSession();
  if (!s) return null;
  const admin = s.role === "ADMIN";
  const order = await prisma.order.findFirst({
    where: admin ? { id: orderId } : { id: orderId, userId: s.uid },
    select: { id: true, ref: true, status: true, paidAt: true },
  });
  return order ? { order, admin } : null;
}

/** Upload one label file. multipart: kind, file */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const a = await access(params.id);
  if (!a) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (!a.admin && (!a.order.paidAt || a.order.status === "CANCELLED")) return NextResponse.json({ error: "This order can't take files right now." }, { status: 400 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: "File storage isn't connected yet." }, { status: 500 });

  const form = await req.formData();
  const kindRaw = String(form.get("kind") || "OTHER");
  const kind = (KINDS as readonly string[]).includes(kindRaw) ? (kindRaw as (typeof KINDS)[number]) : "OTHER";
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Choose a file." }, { status: 400 });
  if (!OK_TYPES.includes(file.type)) return NextResponse.json({ error: "type" }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "size" }, { status: 413 });

  const safeName = file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "file";
  const blob = await put(`orders/${a.order.ref}/docs/${kind.toLowerCase()}-${safeName}`, file, { access: "public", contentType: file.type, addRandomSuffix: true });
  const doc = await prisma.orderDocument.create({
    data: { orderId: a.order.id, kind, name: safeName, url: blob.url, size: file.size, fromAdmin: a.admin },
  });
  if (!a.admin) {
    await prisma.orderEvent.create({ data: { orderId: a.order.id, status: a.order.status, note: `Customer uploaded ${safeName}` } });
  }
  return NextResponse.json({ ok: true, id: doc.id });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const a = await access(params.id);
  if (!a) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const docId = new URL(req.url).searchParams.get("docId");
  const doc = docId ? await prisma.orderDocument.findFirst({ where: { id: docId, orderId: a.order.id } }) : null;
  if (!doc) return NextResponse.json({ error: "File not found." }, { status: 404 });
  // Customers can remove their own files until the order ships
  if (!a.admin && (doc.fromAdmin || ["SHIPPED", "COMPLETED"].includes(a.order.status)))
    return NextResponse.json({ error: "locked" }, { status: 403 });
  await del(doc.url).catch(() => {});
  await prisma.orderDocument.delete({ where: { id: doc.id } });
  return NextResponse.json({ ok: true });
}
