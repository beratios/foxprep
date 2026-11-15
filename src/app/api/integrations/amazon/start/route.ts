import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { getSession } from "@/lib/auth";
import { amazonConfigured, authorizeUrl, type AmazonRegion } from "@/lib/amazon";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login", req.url));
  if (!amazonConfigured()) return NextResponse.redirect(new URL("/dashboard/stores?error=amazon_setup", req.url));
  const region: AmazonRegion = new URL(req.url).searchParams.get("region") === "US" ? "US" : "CA";
  const state = await new SignJWT({ uid: session.uid, region })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("15m")
    .sign(new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me"));
  return NextResponse.redirect(authorizeUrl(region, state));
}
