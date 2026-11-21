import { AppShell } from "@/components/AppShell";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";



export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const open = await prisma.ticket.count({ where: { status: "OPEN" } });
  const nav = [
    { href: "/admin", label: "Orders", exact: true },
    { href: "/admin/support", label: open ? `Support (${open})` : "Support" },
    { href: "/admin/customers", label: "Customers" },
    { href: "/dashboard/account", label: "Account" },
    { href: "/dashboard", label: "Customer view", exact: true },
  ];
  return <AppShell nav={nav} user={user} admin>{children}</AppShell>;
}
