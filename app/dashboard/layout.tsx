import { requireUser } from "@/lib/current-user";
import Sidebar from "@/components/Sidebar";
import WhatsAppButton from "@/components/WhatsAppButton";

const LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/inventory", label: "Inventory" },
  { href: "/dashboard/inbound", label: "Inbound shipments" },
  { href: "/dashboard/outbound", label: "Outbound shipments" },
  { href: "/dashboard/removals", label: "Removals" },
  { href: "/dashboard/wallet", label: "Wallet" },
  { href: "/dashboard/tickets", label: "Support tickets" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen">
      <Sidebar links={LINKS} userLabel={user.name} />
      <div className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full">{children}</div>
      <WhatsAppButton />
    </div>
  );
}
