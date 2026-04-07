import { requireUser } from "@/features/auth/services/auth-service";
import { TasksDashboard } from "@/features/tasks/components/tasks-dashboard";
import { getTasksWorkspace } from "@/features/tasks/services/task-service";

export default async function TasksPage() {
  const user = await requireUser();
  const initialData = await getTasksWorkspace(user.id);

  return <TasksDashboard initialData={initialData} />;
}
