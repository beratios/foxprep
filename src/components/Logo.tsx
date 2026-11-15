import Link from "next/link";

export function FoxMark({ className = "h-7 w-7" }: { className?: string }) {
  // Geometric fox head built from a folded box flap
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M3 4l9 7h8l9-7v13L16 29 3 17z" fill="#E8590C" />
      <path d="M16 29L3 17l7 1 6 5 6-5 7-1z" fill="#14213D" />
      <path d="M12 11h8l-4 6z" fill="#FBFBF8" />
    </svg>
  );
}

export function Logo({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2" aria-label="FoxPrep home">
      <FoxMark />
      <span className={`wide text-[19px] font-extrabold tracking-tight ${light ? "text-white" : "text-ink"}`}>FoxPrep</span>
    </Link>
  );
}
