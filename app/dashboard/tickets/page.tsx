"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Ticket = { id: string; subject: string; status: string; createdAt: string; messages: { body: string }[] };

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const res = await fetch("/api/tickets");
    const data = await res.json();
    setTickets(data.tickets ?? []);
  }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message }),
    });
    setSubmitting(false);
    if (res.ok) {
      setSubject(""); setMessage(""); setOpen(false);
      load();
    }
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Support tickets</h1>
        <button onClick={() => setOpen(!open)} className="btn-primary text-xs px-4 py-2">{open ? "Cancel" : "New ticket"}</button>
      </div>

      {open && (
        <form onSubmit={submit} className="card p-5 mb-6 space-y-3">
          <div>
            <label className="label mb-1 block">Subject</label>
            <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </div>
          <div>
            <label className="label mb-1 block">Message</label>
            <textarea className="input" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} required />
          </div>
          <button className="btn-primary" disabled={submitting}>{submitting ? "Sending…" : "Send"}</button>
        </form>
      )}

      <div className="card divide-y divide-border">
        {tickets.length === 0 && <div className="p-5 text-sm text-muted">No tickets yet — or start a WhatsApp chat using the button in the corner.</div>}
        {tickets.map((t) => (
          <Link key={t.id} href={`/dashboard/tickets/${t.id}`} className="flex items-center justify-between p-4 hover:bg-[#161a1f] text-sm">
            <div>
              <div className="font-semibold">{t.subject}</div>
              <div className="text-xs text-muted line-clamp-1">{t.messages[0]?.body}</div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full border border-border">{t.status}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
