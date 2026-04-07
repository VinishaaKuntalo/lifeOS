import { requireUser } from "@/features/auth/services/auth-service";
import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import { getDashboardWorkspace } from "@/features/dashboard/services/dashboard-service";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardWorkspace(user.id);

  return <DashboardOverview data={data} />;
}
