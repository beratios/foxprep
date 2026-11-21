import { Suspense } from "react";
import { AuthShell } from "@/components/AuthShell";
import { AuthForm } from "@/components/AuthForm";
import { getI18n } from "@/i18n/server";

export default async function Login() {
  const { t } = await getI18n();
  return (
    <AuthShell title={t("auth.login.title", "Log in")} sub={t("auth.login.sub", "Track inbound cartons, pay for orders and manage your balance.")}>
      <Suspense><AuthForm mode="login" /></Suspense>
    </AuthShell>
  );
}
