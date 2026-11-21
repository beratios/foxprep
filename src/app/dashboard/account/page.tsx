import { requireUser } from "@/lib/auth";
import { AccountForms } from "@/components/AccountForms";
import { getI18n } from "@/i18n/server";

export default async function Account() {
  const { t } = await getI18n();
  const user = await requireUser();
  return (
    <div className="max-w-3xl">
      <h1 className="h-page">{t("account_page.account", "Account")}</h1>
      <p className="mt-1 text-ink-soft">
        {t("account_page.customer_code", "Customer code")} <span className="tnum font-bold text-fox-dark">{user.customerCode}</span>, {user.email}
      </p>
      <AccountForms user={{ name: user.name, company: user.company ?? "", phone: user.phone ?? "" }} />
    </div>
  );
}
