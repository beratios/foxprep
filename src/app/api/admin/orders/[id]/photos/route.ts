import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const MAX_BYTES = 4 * 1024 * 1024; // photos are resized in the browser before upload

async function admin() {
  const s = await getSession();
  return s?.role === "ADMIN";
}

/** Upload one or more photos for an order. multipart: kind=INBOUND|OUTBOUND, files=<image>... */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!(await admin())) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: "Photo storage isn't connected yet." }, { status: 500 });
  const order = await prisma.order.findUnique({ where: { id: params.id }, select: { id: true, ref: true } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const form = await req.formData();
  const kind = form.get("kind") === "OUTBOUND" ? "OUTBOUND" : "INBOUND";
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return NextResponse.json({ error: "Choose at least one photo." }, { status: 400 });

  const saved = [];
  for (const [i, f] of files.entries()) {
    if (!f.type.startsWith("image/")) continue;
    if (f.size > MAX_BYTES) return NextResponse.json({ error: `${f.name} is too large.` }, { status: 413 });
    const blob = await put(`orders/${order.ref}/${kind.toLowerCase()}-${Date.now()}-${i}.jpg`, f, {
      access: "public",
      contentType: f.type || "image/jpeg",
      addRandomSuffix: true,
    });
    saved.push(await prisma.orderPhoto.create({ data: { orderId: order.id, kind, url: blob.url } }));
  }
  return NextResponse.json({ ok: true, count: saved.length });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!(await admin())) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const photoId = new URL(req.url).searchParams.get("photoId");
  const photo = photoId ? await prisma.orderPhoto.findFirst({ where: { id: photoId, orderId: params.id } }) : null;
  if (!photo) return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  await del(photo.url).catch(() => {});
  await prisma.orderPhoto.delete({ where: { id: photo.id } });
  return NextResponse.json({ ok: true });
}
