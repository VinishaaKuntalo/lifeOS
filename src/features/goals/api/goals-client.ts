import type {
  GoalMutationResponse,
  GoalsWorkspaceData,
} from "@/features/goals/types/goal";
import type {
  GoalFormInput,
  MilestoneFormInput,
} from "@/features/goals/schemas/goal-schemas";

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

export function fetchGoalsWorkspace() {
  return request<GoalsWorkspaceData>("/api/goals");
}

export function createGoalRequest(input: GoalFormInput) {
  return request<GoalMutationResponse>("/api/goals", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateGoalRequest(goalId: string, input: GoalFormInput) {
  return request<GoalMutationResponse>(`/api/goals/${goalId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function archiveGoalRequest(goalId: string) {
  return request<GoalMutationResponse>(`/api/goals/${goalId}`, {
    method: "DELETE",
  });
}

export function createMilestoneRequest(input: MilestoneFormInput) {
  return request<GoalMutationResponse>("/api/milestones", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
