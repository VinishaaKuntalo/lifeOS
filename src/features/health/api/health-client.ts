import type {
  HealthMutationResponse,
  HealthWorkspaceData,
} from "@/features/health/types/health";
import type { HealthMetricInput } from "@/features/health/schemas/health-schemas";

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

export function fetchHealthWorkspace() {
  return request<HealthWorkspaceData>("/api/health-metrics");
}

export function upsertHealthMetricRequest(input: HealthMetricInput) {
  return request<HealthMutationResponse>("/api/health-metrics", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
