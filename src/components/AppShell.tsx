import { Logo } from "./Logo";
import { NavLinks, type NavItem } from "./NavLinks";
import { money } from "@/lib/pricing";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { getI18n } from "@/i18n/server";

export async function AppShell({
  nav,
  user,
  admin = false,
  children,
}: {
  nav: NavItem[];
  user: { name: string; customerCode: string; balanceCents: number };
  admin?: boolean;
  children: React.ReactNode;
}) {
  const { t } = await getI18n();
  return (
    <div className="min-h-screen md:grid md:grid-cols-[248px_1fr]">
      <aside className="border-b border-line bg-white md:sticky md:top-0 md:h-screen md:border-b-0 md:border-e">
        <div className="flex h-16 items-center justify-between px-5">
          <Logo href={admin ? "/admin" : "/dashboard"} />
          <div className="flex items-center gap-3">
            {admin && <span className="rounded bg-ink px-2 py-0.5 text-xs font-bold text-white">Admin</span>}
            {!admin && <span className="tnum text-sm font-bold md:hidden">{money(user.balanceCents)}</span>}
            <div className="md:hidden"><LanguageSwitcher compact /></div>
            <form action="/api/auth/logout" method="post" className="md:hidden">
              <button className="text-sm font-semibold text-ink-soft">{t("nav.logout", "Log out")}</button>
            </form>
          </div>
        </div>
        {!admin && (
          <div className="mx-4 mb-3 hidden rounded-lg bg-ink p-4 text-white md:block">
            <div className="text-[13px] text-white/70">{t("shell.balance", "Balance")}</div>
            <div className="tnum wide text-2xl font-extrabold">{money(user.balanceCents)}</div>
            <div className="mt-3 flex items-center justify-between text-[13px]">
              <span className="text-white/70">{t("shell.code", "Customer code")}</span>
              <span className="tnum font-bold text-fox">{user.customerCode}</span>
            </div>
          </div>
        )}
        <NavLinks items={nav} />
        <div className="hidden px-4 pb-6 md:absolute md:bottom-0 md:block md:w-[247px]">
          <div className="mb-3 px-3"><LanguageSwitcher up /></div>
          <form action="/api/auth/logout" method="post">
            <div className="mb-2 truncate px-3 text-sm text-ink-soft">{user.name}</div>
            <button className="w-full rounded-md px-3 py-2 text-start text-sm font-semibold text-ink hover:bg-paper">{t("nav.logout", "Log out")}</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 px-5 py-8 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
