"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem { href: string; label: string; exact?: boolean }

export function NavLinks({ items }: { items: NavItem[] }) {
  const path = usePathname();
  // Only the most specific matching item is active (so /orders/new doesn't also light up /orders)
  const matches = items.filter((i) => (i.exact ? path === i.href : path === i.href || path.startsWith(i.href + "/")));
  const activeHref = matches.sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:pb-0" aria-label="Main">
      {items.map((i) => {
        const active = i.href === activeHref;
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-[15px] font-semibold transition-colors ${
              active ? "bg-fox-tint text-fox-dark" : "text-ink-2 hover:bg-paper hover:text-ink"
            }`}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
