import { requireStaffOrAdmin } from "@/lib/current-user";
import Sidebar from "@/components/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaffOrAdmin();

  const links = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/inbound", label: "Inbound shipments" },
    { href: "/admin/outbound", label: "Outbound shipments" },
    { href: "/admin/inventory", label: "Inventory" },
    { href: "/admin/removals", label: "Removals" },
    { href: "/admin/tickets", label: "Support tickets" },
    // Pricing and Customers touch money directly — ADMIN only, hidden from STAFF.
    ...(staff.role === "ADMIN"
      ? [
          { href: "/admin/customers", label: "Customers" },
          { href: "/admin/pricing", label: "Pricing" },
          { href: "/admin/billing", label: "Billing" },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar links={links} userLabel={`${staff.name} · ${staff.role === "ADMIN" ? "Admin" : "Warehouse staff"}`} />
      <div className="flex-1 p-6 md:p-10">{children}</div>
    </div>
  );
}
