// Amazon SP-API integration — STUB. Nothing here calls Amazon yet.
//
// TODO before going live:
//   1. Register as an SP-API developer:
//      https://developer-docs.amazon.com/sp-api/docs/registering-your-application
//   2. Set AMAZON_LWA_CLIENT_ID / AMAZON_LWA_CLIENT_SECRET / AMAZON_APP_ID in .env
//   3. Implement the LWA OAuth redirect in /api/amazon/connect (currently a
//      placeholder that just marks the user as "connected" for demo purposes)
//   4. Implement /api/amazon/callback to exchange the authorization code for
//      a refresh token, and store it (encrypted) against the User row —
//      add an `amazonRefreshToken` field to the User model when ready
//   5. Implement real inventory sync in syncInventory() below using the
//      SP-API "FBA Inventory" or "Listings Items" endpoints

export type AmazonConnectionStatus = "not_connected" | "connected" | "error";

export async function startAmazonOAuth(userId: string): Promise<string> {
  // TODO: build the real Login with Amazon (LWA) authorization URL using
  // AMAZON_APP_ID and a state param tied to userId, then redirect the user there.
  // For now this just returns a placeholder URL so the UI flow can be tested.
  return `/api/amazon/callback?demo=true&userId=${userId}`;
}

export async function exchangeAuthCodeForTokens(code: string) {
  // TODO: POST to https://api.amazon.com/auth/o2/token with the code,
  // client id/secret, and grant_type=authorization_code. Store the
  // returned refresh_token against the user.
  throw new Error("exchangeAuthCodeForTokens is not implemented yet — see lib/amazon.ts");
}

export async function syncInventory(userId: string) {
  // TODO: call SP-API's inventory endpoint using the user's stored refresh
  // token, map the response into Order/stock records, and return a summary.
  return { synced: false, reason: "Amazon SP-API not yet connected — see lib/amazon.ts" };
}
