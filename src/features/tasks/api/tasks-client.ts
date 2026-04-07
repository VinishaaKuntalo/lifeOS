import type {
  TaskMutationResponse,
  TasksWorkspaceData,
} from "@/features/tasks/types/task";
import type {
  ProjectFormInput,
  TaskFormInput,
  TaskMoveInput,
} from "@/features/tasks/schemas/task-schemas";

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(error?.message ?? "Request failed.");
  }

  return (await response.json()) as T;
}

export function fetchTasksWorkspace() {
  return request<TasksWorkspaceData>("/api/tasks");
}

export function createTaskRequest(input: TaskFormInput) {
  return request<TaskMutationResponse>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTaskRequest(taskId: string, input: TaskFormInput) {
  return request<TaskMutationResponse>(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function moveTaskRequest(taskId: string, input: TaskMoveInput) {
  return request<TaskMutationResponse>(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function archiveTaskRequest(taskId: string) {
  return request<TaskMutationResponse>(`/api/tasks/${taskId}`, {
    method: "DELETE",
  });
}

export function createProjectRequest(input: ProjectFormInput) {
  return request<TaskMutationResponse>("/api/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
