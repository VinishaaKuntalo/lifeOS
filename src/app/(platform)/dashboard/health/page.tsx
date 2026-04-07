import { requireUser } from "@/features/auth/services/auth-service";
import { HealthDashboard } from "@/features/health/components/health-dashboard";
import { getHealthWorkspace } from "@/features/health/services/health-service";

export default async function HealthPage() {
  const user = await requireUser();
  const initialData = await getHealthWorkspace(user.id);

  return <HealthDashboard initialData={initialData} />;
}
