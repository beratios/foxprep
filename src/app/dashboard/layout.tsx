import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { getI18n } from "@/i18n/server";
import { WhatsAppButton } from "@/components/WhatsApp";

export const dynamic = "force-dynamic";



export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const { t } = await getI18n();
  const NAV = [
    { href: "/dashboard", label: t("nav.overview", "Overview"), exact: true },
    { href: "/dashboard/orders/new", label: t("nav.newOrder", "New order"), exact: true },
    { href: "/dashboard/orders", label: t("nav.orders", "Orders") },
    { href: "/dashboard/products", label: t("nav.products", "Products") },
    { href: "/dashboard/balance", label: t("nav.balance", "Balance") },
    { href: "/dashboard/stores", label: t("nav.stores", "Connected stores") },
    { href: "/dashboard/support", label: t("nav.support", "Support") },
    { href: "/dashboard/account", label: t("nav.account", "Account") },
  ];
  const nav = user.role === "ADMIN" ? [...NAV, { href: "/admin", label: "Admin panel" }] : NAV;
  return (
    <AppShell nav={nav} user={user}>
      {children}
      <WhatsAppButton label={t("wa.button", "WhatsApp us")} text={`Hi FoxPrep, this is ${user.name} (${user.customerCode}).`} />
    </AppShell>
  );
}
