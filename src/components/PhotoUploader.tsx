"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { shrinkImage as shrink } from "@/lib/shrinkImage";

interface Photo { id: string; url: string; kind: "INBOUND" | "OUTBOUND" }

export function PhotoUploader({ orderId, photos }: { orderId: string; photos: Photo[] }) {
  const router = useRouter();
  const [kind, setKind] = useState<"INBOUND" | "OUTBOUND">(photos.some((p) => p.kind === "INBOUND") ? "OUTBOUND" : "INBOUND");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const list = Array.from(files);
    for (const [i, f] of list.entries()) {
      setBusy(`Uploading ${i + 1} of ${list.length}…`);
      const fd = new FormData();
      fd.set("kind", kind);
      fd.append("files", await shrink(f), `photo-${i}.jpg`);
      const res = await fetch(`/api/admin/orders/${orderId}/photos`, { method: "POST", body: fd });
      if (!res.ok) {
        setError((await res.json().catch(() => ({}))).error || "Upload failed.");
        break;
      }
    }
    setBusy(null);
    router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this photo?")) return;
    await fetch(`/api/admin/orders/${orderId}/photos?photoId=${id}`, { method: "DELETE" });
    router.refresh();
  }

  const groups: [Photo["kind"], string][] = [["INBOUND", "On arrival"], ["OUTBOUND", "Before shipping"]];
  return (
    <div className="panel space-y-4 p-5">
      <h2 className="text-lg font-bold">Photos</h2>
      <div className="grid grid-cols-2 gap-2">
        {groups.map(([k, label]) => (
          <button key={k} type="button" onClick={() => setKind(k)} className={`rounded-md border-2 px-3 py-2 text-sm font-semibold ${kind === k ? "border-ink bg-ink text-white" : "border-line"}`}>
            {label}
          </button>
        ))}
      </div>
      <label className={`btn-fox w-full cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}>
        {busy || `Add ${kind === "INBOUND" ? "arrival" : "shipping"} photos`}
        <input type="file" accept="image/*" multiple capture="environment" className="sr-only" onChange={(e) => upload(e.target.files)} disabled={!!busy} />
      </label>
      {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}
      {groups.map(([k, label]) => {
        const list = photos.filter((p) => p.kind === k);
        if (!list.length) return null;
        return (
          <div key={k}>
            <div className="mb-2 text-sm font-semibold text-ink-soft">{label} ({list.length})</div>
            <div className="grid grid-cols-3 gap-2">
              {list.map((p) => (
                <div key={p.id} className="group relative">
                  <a href={p.url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={`${label} photo`} className="aspect-[4/3] w-full rounded-md border border-line object-cover" />
                  </a>
                  <button type="button" onClick={() => remove(p.id)} className="absolute right-1 top-1 rounded bg-white/90 px-1.5 text-xs font-bold text-red-600 opacity-0 shadow group-hover:opacity-100 focus:opacity-100" aria-label="Delete photo">✕</button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <p className="text-[12.5px] text-ink-soft">Add photos first, then change the status. The customer gets an email with the photos for that step.</p>
    </div>
  );
}

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  const groups: [Photo["kind"], string][] = [["INBOUND", "When it arrived"], ["OUTBOUND", "Before it shipped"]];
  if (!photos.length) return null;
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">Photos</h2>
      <div className="space-y-5">
        {groups.map(([k, label]) => {
          const list = photos.filter((p) => p.kind === k);
          if (!list.length) return null;
          return (
            <div key={k}>
              <div className="mb-2 text-sm font-semibold text-ink-soft">{label}</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {list.map((p) => (
                  <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={`${label} photo`} className="aspect-[4/3] w-full rounded-md border border-line object-cover" />
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
