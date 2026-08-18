"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type AdminTicket = {
  id: string; subject: string; status: string; createdAt: string;
  user: { name: string; email: string }; messages: { body: string }[];
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  useEffect(() => {
    fetch("/api/admin/tickets").then((r) => r.json()).then((d) => setTickets(d.tickets ?? []));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Support tickets</h1>
      <div className="card divide-y divide-border">
        {tickets.length === 0 && <div className="p-5 text-sm text-muted">No tickets yet.</div>}
        {tickets.map((t) => (
          <Link key={t.id} href={`/dashboard/tickets/${t.id}`} className="flex items-center justify-between p-4 hover:bg-[#161a1f] text-sm">
            <div>
              <div className="font-semibold">{t.subject} <span className="text-muted font-normal">· {t.user.name}</span></div>
              <div className="text-xs text-muted line-clamp-1">{t.messages[0]?.body}</div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full border border-border">{t.status}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
