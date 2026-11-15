import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");

export async function middleware(req: NextRequest) {
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
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/admin") && role !== "ADMIN") return NextResponse.redirect(new URL("/dashboard", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] };
