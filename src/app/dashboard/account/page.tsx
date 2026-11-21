import { requireUser } from "@/lib/auth";
import { AccountForms } from "@/components/AccountForms";

export default async function Account() {
  const user = await requireUser();
  return (
    <div className="max-w-3xl">
      <h1 className="h-page">Account</h1>
      <p className="mt-1 text-ink-soft">
        Customer code <span className="tnum font-bold text-fox-dark">{user.customerCode}</span>, {user.email}
      </p>
      <AccountForms user={{ name: user.name, company: user.company ?? "", phone: user.phone ?? "" }} />
    </div>
  );
}
