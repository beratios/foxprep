"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { shrinkImage } from "@/lib/shrinkImage";

const MAX = 8;

export function TicketComposer({
  endpoint,
  newTicket = false,
  orders = [],
  defaultOrderId,
  submitLabel = "Send",
  placeholder = "Write your message",
}: {
  endpoint: string;
  newTicket?: boolean;
  orders?: { id: string; ref: string }[];
  defaultOrderId?: string;
  submitLabel?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [orderId, setOrderId] = useState(defaultOrderId || "");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bad, setBad] = useState<string | null>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [files]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBad(null);
    if (newTicket && !subject.trim()) {
      setBad("subject");
      setError("Add a subject.");
      return subjectRef.current?.focus();
    }
    if (!body.trim() && (newTicket || !files.length)) {
      setBad("body");
      setError("Write a message.");
      return bodyRef.current?.focus();
    }
    setBusy(true);
    const fd = new FormData();
    if (newTicket) {
      fd.set("subject", subject);
      if (orderId) fd.set("orderId", orderId);
    }
    fd.set("body", body);
    for (const [i, f] of files.entries()) fd.append("files", await shrinkImage(f), `photo-${i}.jpg`);
    const res = await fetch(endpoint, { method: "POST", body: fd });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(json.error || "Couldn't send. Try again.");
      if (json.field) setBad(json.field);
      return;
    }
    if (json.url) return router.push(json.url);
    setBody("");
    setFiles([]);
    router.refresh();
  }

  const red = "border-red-600 ring-1 ring-red-600";
  return (
    <form onSubmit={send} className="space-y-3" noValidate>
      {newTicket && (
        <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
          <div>
            <label htmlFor="t-subject" className={`label ${bad === "subject" ? "!text-red-600" : ""}`}>Subject *</label>
            <input id="t-subject" ref={subjectRef} className={`field ${bad === "subject" ? red : ""}`} maxLength={160} placeholder="e.g. 2 cartons missing from IN-AB12CD" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label htmlFor="t-order" className="label">Related order</label>
            <select id="t-order" className="field" value={orderId} onChange={(e) => setOrderId(e.target.value)}>
              <option value="">None</option>
              {orders.map((o) => <option key={o.id} value={o.id}>{o.ref}</option>)}
            </select>
          </div>
        </div>
      )}
      <div>
        <label htmlFor="t-body" className={`label ${newTicket ? "" : "sr-only"} ${bad === "body" ? "!text-red-600" : ""}`}>Message *</label>
        <textarea id="t-body" ref={bodyRef} rows={newTicket ? 6 : 4} className={`field ${bad === "body" ? red : ""}`} placeholder={placeholder} value={body} onChange={(e) => setBody(e.target.value)} />
      </div>
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((u, i) => (
            <div key={u} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-20 w-20 rounded-md border border-line object-cover" />
              <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="absolute -right-1.5 -top-1.5 h-6 w-6 rounded-full bg-ink text-xs font-bold text-white" aria-label="Remove photo">✕</button>
            </div>
          ))}
        </div>
      )}
      {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-fox" disabled={busy}>{busy ? "Sending…" : submitLabel}</button>
        <label className={`btn-ghost cursor-pointer ${files.length >= MAX ? "pointer-events-none opacity-50" : ""}`}>
          Attach photos
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              const picked = Array.from(e.target.files || []);
              setFiles((f) => [...f, ...picked].slice(0, MAX));
              e.target.value = "";
            }}
          />
        </label>
        <span className="text-[13px] text-ink-soft">Up to {MAX} photos</span>
      </div>
    </form>
  );
}
