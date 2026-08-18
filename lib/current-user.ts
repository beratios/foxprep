import { prisma } from "./prisma";
import { getSession } from "./session";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

// STAFF can access the warehouse-ops parts of /admin (inbound, outbound,
// inventory, removals, tickets) but NOT pricing config or customer wallet
// adjustments — those pages call requireAdmin() individually on top of this.
export async function requireStaffOrAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" && user.role !== "STAFF") redirect("/dashboard");
  return user;
}
