import type {
  JournalMutationResponse,
  JournalWorkspaceData,
} from "@/features/journal/types/journal";
import type { JournalEntryInput } from "@/features/journal/schemas/journal-schemas";

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

export function fetchJournalWorkspace() {
  return request<JournalWorkspaceData>("/api/journal");
}

export function upsertJournalEntryRequest(input: JournalEntryInput) {
  return request<JournalMutationResponse>("/api/journal", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
