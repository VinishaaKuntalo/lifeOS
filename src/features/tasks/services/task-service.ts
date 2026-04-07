import "server-only";

import { createClient } from "@/lib/supabase/server";

import type {
  Project,
  Task,
  TaskBucket,
  TasksWorkspaceData,
  TaskView,
} from "@/features/tasks/types/task";
import type {
  ProjectFormInput,
  TaskFormInput,
  TaskMoveInput,
} from "@/features/tasks/schemas/task-schemas";

function emptyBuckets(): Record<TaskBucket, TaskView[]> {
  return {
    inbox: [],
    today: [],
    upcoming: [],
    someday: [],
  };
}

function normalizeDueAt(value?: string) {
  if (!value) {
    return null;
  }

  return `${value}T12:00:00.000Z`;
}

export async function ensureInboxProject(userId: string) {
  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .eq("is_inbox", true)
    .is("deleted_at", null)
    .maybeSingle<Project>();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name: "Inbox",
      description: "Default capture project",
      is_inbox: true,
      color: "#334155",
    })
    .select("*")
    .single<Project>();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create inbox project.");
  }

  return data;
}

export async function getTasksWorkspace(
  userId: string,
): Promise<TasksWorkspaceData> {
  const supabase = await createClient();
  await ensureInboxProject(userId);

  const [
    { data: projects, error: projectsError },
    { data: tasks, error: tasksError },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("is_inbox", { ascending: false })
      .order("sort_order", { ascending: true })
      .returns<Project[]>(),
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .returns<Task[]>(),
  ]);

  if (projectsError) {
    throw new Error(projectsError.message);
  }

  if (tasksError) {
    throw new Error(tasksError.message);
  }

  const projectMap = new Map(
    (projects ?? []).map((project) => [project.id, project]),
  );
  const subtasksByParent = new Map<string, Task[]>();
  const rootTasks = (tasks ?? []).filter((task) => {
    if (!task.parent_task_id) {
      return true;
    }

    const current = subtasksByParent.get(task.parent_task_id) ?? [];
    subtasksByParent.set(task.parent_task_id, [...current, task]);
    return false;
  });

  const buckets = emptyBuckets();
  for (const task of rootTasks) {
    buckets[task.bucket].push({
      task,
      project: task.project_id
        ? (projectMap.get(task.project_id) ?? null)
        : null,
      subtasks: (subtasksByParent.get(task.id) ?? []).sort(
        (a, b) => a.sort_order - b.sort_order,
      ),
    });
  }

  const dueTodayCount = rootTasks.filter((task) => {
    if (!task.due_at || task.status === "completed") {
      return false;
    }

    return task.due_at.slice(0, 10) <= new Date().toISOString().slice(0, 10);
  }).length;

  return {
    summary: {
      inboxCount: buckets.inbox.length,
      dueTodayCount,
      upcomingCount: buckets.upcoming.length,
      completedCount: rootTasks.filter((task) => task.status === "completed")
        .length,
    },
    projects: projects ?? [],
    buckets,
  };
}

export async function createProject(userId: string, input: ProjectFormInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").insert({
    user_id: userId,
    name: input.name,
    description: input.description?.trim() || null,
    color: input.color?.trim() || null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function createTask(userId: string, input: TaskFormInput) {
  const supabase = await createClient();
  const inboxProject = await ensureInboxProject(userId);

  const { error } = await supabase.from("tasks").insert({
    user_id: userId,
    title: input.title,
    description: input.description?.trim() || null,
    bucket: input.bucket,
    priority: input.priority,
    due_at: normalizeDueAt(input.dueAt),
    project_id: input.projectId || inboxProject.id,
    parent_task_id: input.parentTaskId || null,
    effort_minutes:
      typeof input.effortMinutes === "number" ? input.effortMinutes : null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: TaskFormInput,
) {
  const supabase = await createClient();
  const inboxProject = await ensureInboxProject(userId);

  const { error } = await supabase
    .from("tasks")
    .update({
      title: input.title,
      description: input.description?.trim() || null,
      bucket: input.bucket,
      priority: input.priority,
      due_at: normalizeDueAt(input.dueAt),
      project_id: input.projectId || inboxProject.id,
      parent_task_id: input.parentTaskId || null,
      effort_minutes:
        typeof input.effortMinutes === "number" ? input.effortMinutes : null,
    })
    .eq("id", taskId)
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }
}

export async function moveTask(
  userId: string,
  taskId: string,
  input: TaskMoveInput,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      bucket: input.bucket,
      sort_order: input.sortOrder,
    })
    .eq("id", taskId)
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }
}

export async function archiveTask(userId: string, taskId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }
}
