import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { DEFAULT_RATES } from "@/lib/pricing";

// Read-only current rates for any logged-in user — powers the price
// estimator on the customer dashboard. Not sensitive data (these are the
// same numbers shown on the public pricing page), just needs a login.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.pricingSetting.findUnique({ where: { id: "default" } });
  return NextResponse.json({ rates: settings ?? DEFAULT_RATES });
}
