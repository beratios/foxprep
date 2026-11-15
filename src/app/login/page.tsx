import { Suspense } from "react";
import { AuthShell } from "@/components/AuthShell";
import { AuthForm } from "@/components/AuthForm";

export default function Login() {
  return (
    <AuthShell title="Log in" sub="Track inbound cartons, pay for orders and manage your balance.">
      <Suspense><AuthForm mode="login" /></Suspense>
    </AuthShell>
  );
}
