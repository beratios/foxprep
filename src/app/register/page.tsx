import { Suspense } from "react";
import { AuthShell } from "@/components/AuthShell";
import { AuthForm } from "@/components/AuthForm";

export default function Register() {
  return (
    <AuthShell title="Create your account" sub="Free, no monthly fee. You get a customer code for your supplier's cartons right away.">
      <Suspense><AuthForm mode="register" /></Suspense>
    </AuthShell>
  );
}
