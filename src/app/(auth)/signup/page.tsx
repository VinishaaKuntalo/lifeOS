import { AuthForm } from "@/features/auth/components/auth-form";
import { AuthShell } from "@/features/auth/components/auth-shell";

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Start with a secure account and let LifeOS create your profile automatically."
      footer="After signup, email confirmation can return through the shared auth callback route."
    >
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
