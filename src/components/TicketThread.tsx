interface Msg { id: string; fromAdmin: boolean; author: string; body: string; photos: string[]; createdAt: Date }

/** Conversation view. `viewerIsAdmin` puts the viewer's own messages on the right. */
export function TicketThread({ messages, viewerIsAdmin }: { messages: Msg[]; viewerIsAdmin: boolean }) {
  return (
    <ol className="space-y-4">
      {messages.map((m) => {
        const mine = m.fromAdmin === viewerIsAdmin;
        return (
          <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-lg border p-4 sm:max-w-[75%] ${m.fromAdmin ? "border-ink/15 bg-white" : "border-fox/30 bg-fox-tint/50"}`}>
              <div className="mb-1 flex flex-wrap items-baseline gap-x-3 text-[13px]">
                <span className="font-bold text-ink">{m.fromAdmin ? "FoxPrep" : m.author}</span>
                <span className="tnum text-ink-soft">{m.createdAt.toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</span>
              </div>
              {m.body && <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{m.body}</p>}
              {m.photos.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {m.photos.map((u) => (
                    <a key={u} href={u} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt="Attached photo" className="aspect-square w-full rounded-md border border-line object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
