import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";

export const SESSION_COOKIE = "fp_session";
const secret = () => new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");

export interface Session {
  uid: string;
  role: "CUSTOMER" | "ADMIN";
}

export async function signSession(s: Session) {
  return new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secret());
}

export async function verifySession(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { uid: String(payload.uid), role: payload.role === "ADMIN" ? "ADMIN" : "CUSTOMER" };
  } catch {
    return null;
  }
}

export async function setSessionCookie(s: Session) {
  cookies().set(SESSION_COOKIE, await signSession(s), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}

export async function getSession() {
  return verifySession(cookies().get(SESSION_COOKIE)?.value);
}

export async function currentUser() {
  const s = await getSession();
  if (!s) return null;
  return prisma.user.findUnique({ where: { id: s.uid } });
}

export async function requireUser() {
  const u = await currentUser();
  if (!u) redirect("/login");
  return u;
}

export async function requireAdmin() {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (u.role !== "ADMIN") redirect("/dashboard");
  return u;
}
