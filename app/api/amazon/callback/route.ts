import { NextRequest, NextResponse } from "next/server";

// TODO: exchange the `code` query param for LWA tokens via
// exchangeAuthCodeForTokens() in lib/amazon.ts, store the refresh token, then
// redirect to the dashboard. Currently unused because /api/amazon/connect
// short-circuits straight to "connected" for demo purposes.
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/dashboard/settings?amazon=connected", req.url));
}
