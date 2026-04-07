import { requireUser } from "@/features/auth/services/auth-service";
import { HabitsDashboard } from "@/features/habits/components/habits-dashboard";
import { getHabitsDashboard } from "@/features/habits/services/habit-service";

export default async function HabitsPage() {
  const user = await requireUser();
  const initialData = await getHabitsDashboard(user.id);

  return <HabitsDashboard initialData={initialData} />;
}
