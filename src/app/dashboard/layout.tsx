import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { WhatsAppButton } from "@/components/WhatsApp";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/orders/new", label: "New order", exact: true },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/balance", label: "Balance" },
  { href: "/dashboard/stores", label: "Connected stores" },
  { href: "/dashboard/support", label: "Support" },
  { href: "/dashboard/account", label: "Account" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const nav = user.role === "ADMIN" ? [...NAV, { href: "/admin", label: "Admin panel" }] : NAV;
  return (
    <AppShell nav={nav} user={user}>
      {children}
      <WhatsAppButton text={`Hi FoxPrep, this is ${user.name} (${user.customerCode}).`} />
    </AppShell>
  );
}
