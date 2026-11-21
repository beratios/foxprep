export const whatsappNumber = () => (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");

export function whatsappLink(text = "Hi FoxPrep, I have a question about prep services.") {
  const n = whatsappNumber();
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : null;
}

function Icon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91A9.85 9.85 0 0 0 12.04 2Zm5.8 14.13c-.24.69-1.42 1.32-1.96 1.37-.5.05-.97.23-3.27-.68-2.77-1.09-4.52-3.93-4.66-4.11-.13-.18-1.11-1.48-1.11-2.82 0-1.34.7-2 .95-2.27.25-.27.54-.34.72-.34h.52c.17 0 .39-.06.61.47.24.56.79 1.92.86 2.06.07.14.11.3.02.48-.09.18-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.28.71 1.17 1.53 1.9 1.05.93 1.93 1.22 2.21 1.36.27.14.43.11.59-.07.16-.18.68-.8.86-1.07.18-.27.36-.23.61-.14.25.09 1.59.75 1.86.89.27.14.45.2.52.32.07.11.07.66-.17 1.35Z" />
    </svg>
  );
}

/** Floating chat button. Renders nothing until NEXT_PUBLIC_WHATSAPP_NUMBER is set. */
export function WhatsAppButton({ text, label = "WhatsApp us" }: { text?: string; label?: string }) {
  const href = whatsappLink(text);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="wa-float fixed bottom-5 end-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] py-3 pl-3 pr-4 font-semibold text-white shadow-[0_10px_30px_-10px_rgba(20,33,61,.6)] hover:bg-[#1EBE5A]"
    >
      <Icon />
      <span className="text-[15px]">{label}</span>
    </a>
  );
}

export function WhatsAppLink({ text, children, className = "" }: { text?: string; children: React.ReactNode; className?: string }) {
  const href = whatsappLink(text);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

export { Icon as WhatsAppIcon };
