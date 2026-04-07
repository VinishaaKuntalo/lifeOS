import type {
  HabitMutationResponse,
  HabitsDashboardData,
} from "@/features/habits/types/habit";
import type {
  HabitFormInput,
  HabitLogInput,
} from "@/features/habits/schemas/habit-schemas";

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

export function fetchHabitsDashboard() {
  return request<HabitsDashboardData>("/api/habits");
}

export function createHabitRequest(input: HabitFormInput) {
  return request<HabitMutationResponse>("/api/habits", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateHabitRequest(habitId: string, input: HabitFormInput) {
  return request<HabitMutationResponse>(`/api/habits/${habitId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function archiveHabitRequest(habitId: string) {
  return request<HabitMutationResponse>(`/api/habits/${habitId}`, {
    method: "DELETE",
  });
}

export function toggleHabitLogRequest(habitId: string, input: HabitLogInput) {
  return request<HabitMutationResponse>(`/api/habits/${habitId}/logs`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
