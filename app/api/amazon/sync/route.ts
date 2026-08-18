import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { syncInventory } from "@/lib/amazon";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await syncInventory(session.userId);
  return NextResponse.json(result);
}
