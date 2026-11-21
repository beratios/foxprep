import Link from "next/link";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { getI18n } from "@/i18n/server";

export async function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const { t } = await getI18n();
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-page items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-7 text-[15px] font-medium text-ink-2 md:flex">
          <a href="#how" className="hover:text-fox">{t("nav.how", "How it works")}</a>
          <a href="#rates" className="hover:text-fox">{t("nav.rates", "Rates")}</a>
          <a href="#quote" className="hover:text-fox">{t("nav.quote", "Price a shipment")}</a>
          <a href="#faq" className="hover:text-fox">{t("nav.faq", "FAQ")}</a>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          {signedIn ? (
            <Link href="/dashboard" className="btn-ink btn-sm">{t("nav.dashboard", "Open dashboard")}</Link>
          ) : (
            <>
              <Link href="/login" className="btn-sm hidden rounded-md px-3 py-2 text-sm font-semibold text-ink hover:text-fox sm:inline-flex">{t("nav.login", "Log in")}</Link>
              <Link href="/register" className="btn-fox btn-sm">{t("nav.register", "Create account")}</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
