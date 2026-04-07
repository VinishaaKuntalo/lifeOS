import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireUser } from "@/features/auth/services/auth-service";

export default async function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
