import { Suspense } from "react";
import { AuthShell } from "@/components/AuthShell";
import { AuthForm } from "@/components/AuthForm";
import { getI18n } from "@/i18n/server";

export default async function Register() {
  const { t } = await getI18n();
  return (
    <AuthShell title={t("auth.register.title", "Create your account")} sub={t("auth.register.sub", "Free, no monthly fee. You get a customer code for your supplier's cartons right away.")}>
      <Suspense><AuthForm mode="register" /></Suspense>
    </AuthShell>
  );
}
