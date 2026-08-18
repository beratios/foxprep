"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { COMPANY_NAME } from "@/lib/config";

export default function Sidebar({
  links,
  userLabel,
}: {
  links: { href: string; label: string }[];
  userLabel: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-56 shrink-0 border-r border-border min-h-screen p-4 hidden md:flex md:flex-col">
      <div className="font-display font-bold text-lg mb-1">{COMPANY_NAME}</div>
      <div className="text-xs text-muted mb-6">{userLabel}</div>
      <nav className="flex flex-col gap-1 flex-1">
        {links.map((l) => {
          const active = pathname === l.href || (l.href !== "/dashboard" && l.href !== "/admin" && pathname.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2 rounded-lg text-sm ${active ? "bg-accent text-[#161207] font-semibold" : "text-[#c7cbd1] hover:bg-[#181b20]"}`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <button onClick={logout} className="text-left text-xs text-muted hover:text-[#eef0f2] mt-4">
        Log out
      </button>
    </aside>
  );
}
