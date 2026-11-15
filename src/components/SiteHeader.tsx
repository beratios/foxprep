import Link from "next/link";
import { Logo } from "./Logo";

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-page items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-7 text-[15px] font-medium text-ink-2 md:flex">
          <a href="#how" className="hover:text-fox">How it works</a>
          <a href="#rates" className="hover:text-fox">Rates</a>
          <a href="#calculator" className="hover:text-fox">Price a shipment</a>
          <a href="#faq" className="hover:text-fox">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <Link href="/dashboard" className="btn-ink btn-sm">Open dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="btn-sm hidden rounded-md px-3 py-2 text-sm font-semibold text-ink hover:text-fox sm:inline-flex">Log in</Link>
              <Link href="/register" className="btn-fox btn-sm">Create account</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
