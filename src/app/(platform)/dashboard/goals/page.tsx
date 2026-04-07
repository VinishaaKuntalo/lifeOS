import { requireUser } from "@/features/auth/services/auth-service";
import { GoalsDashboard } from "@/features/goals/components/goals-dashboard";
import { getGoalsWorkspace } from "@/features/goals/services/goal-service";

export default async function GoalsPage() {
  const user = await requireUser();
  const initialData = await getGoalsWorkspace(user.id);

  return <GoalsDashboard initialData={initialData} />;
}
