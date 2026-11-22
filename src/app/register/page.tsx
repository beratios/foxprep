import { Suspense } from "react";
import { AuthShell } from "@/components/AuthShell";
import { AuthForm } from "@/components/AuthForm";
import { headers } from "next/headers";
import { getI18n } from "@/i18n/server";
import { guessCountry } from "@/lib/dialCodes";

export default async function Register() {
  const { t, locale } = await getI18n();
  const country = guessCountry(headers().get("x-vercel-ip-country"), locale);
  return (
    <AuthShell title={t("auth.register.title", "Create your account")} sub={t("auth.register.sub", "Free, no monthly fee. You get a customer code for your supplier's cartons right away.")}>
      <Suspense><AuthForm mode="register" country={country} /></Suspense>
    </AuthShell>
  );
}
