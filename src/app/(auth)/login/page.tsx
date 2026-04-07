import { AuthForm } from "@/features/auth/components/auth-form";
import { AuthShell } from "@/features/auth/components/auth-shell";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: {
    redirectedFrom?: string;
  };
}) {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to continue managing your dashboard, routines, goals, and analytics."
      footer="Email/password and Google OAuth both use Supabase Auth with SSR-safe sessions."
    >
      <AuthForm mode="login" redirectTo={searchParams?.redirectedFrom} />
    </AuthShell>
  );
}
