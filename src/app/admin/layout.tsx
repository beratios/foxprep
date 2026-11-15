import { AppShell } from "@/components/AppShell";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Orders", exact: true },
  { href: "/admin/customers", label: "Customers" },
  { href: "/dashboard", label: "Customer view" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return <AppShell nav={NAV} user={user} admin>{children}</AppShell>;
}
