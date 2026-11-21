import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { LOCALE_COOKIE, isLocale, negotiate } from "@/i18n/config";

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");

/** First visit: pick the language from the browser and remember it. */
function withLocale(req: NextRequest, res: NextResponse) {
  if (!isLocale(req.cookies.get(LOCALE_COOKIE)?.value)) {
    res.cookies.set(LOCALE_COOKIE, negotiate(req.headers.get("accept-language")), { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname: path } = req.nextUrl;
  if (!path.startsWith("/dashboard") && !path.startsWith("/admin")) {
    // Locale cookie must exist before the page renders, so pass it on the request too
    if (!isLocale(req.cookies.get(LOCALE_COOKIE)?.value)) {
      const locale = negotiate(req.headers.get("accept-language"));
      req.cookies.set(LOCALE_COOKIE, locale);
      const res = NextResponse.next({ request: { headers: req.headers } });
      res.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
      return res;
    }
    return NextResponse.next();
  }
  const token = req.cookies.get("fp_session")?.value;
  let role: string | null = null;
  if (token) {
    try {
      role = String((await jwtVerify(token, secret())).payload.role);
    } catch {}
  }
  const { pathname, search } = req.nextUrl;
  if (!role) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname + search);
    return withLocale(req, NextResponse.redirect(url));
  }
  if (pathname.startsWith("/admin") && role !== "ADMIN") return NextResponse.redirect(new URL("/dashboard", req.url));
  return withLocale(req, NextResponse.next());
}

export const config = { matcher: ["/((?!api|_next|flags|favicon|.*\\..*).*)"] };
