"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Msg = { id: string; senderRole: string; body: string; createdAt: string };
type TicketDetail = { id: string; subject: string; status: string; messages: Msg[] };

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    const res = await fetch(`/api/tickets/${id}`);
    const data = await res.json();
    setTicket(data.ticket);
  }
  useEffect(() => { load(); }, [id]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    await fetch(`/api/tickets/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: reply }),
    });
    setReply("");
    setSending(false);
    load();
  }

  if (!ticket) return <div className="text-muted text-sm">Loading…</div>;

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-xl font-bold mb-1">{ticket.subject}</h1>
      <div className="text-xs text-muted mb-6">{ticket.status}</div>

      <div className="card divide-y divide-border mb-5">
        {ticket.messages.map((m) => (
          <div key={m.id} className="p-4 text-sm">
            <div className="text-xs text-muted mb-1">{m.senderRole !== "CUSTOMER" ? "FoxPrep team" : "You"} · {new Date(m.createdAt).toLocaleString()}</div>
            <div>{m.body}</div>
          </div>
        ))}
      </div>

      <form onSubmit={send} className="flex gap-2">
        <input className="input" placeholder="Write a reply…" value={reply} onChange={(e) => setReply(e.target.value)} />
        <button className="btn-primary" disabled={sending}>Send</button>
      </form>
    </div>
  );
}
