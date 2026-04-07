import type {
  FinanceMutationResponse,
  FinanceWorkspaceData,
} from "@/features/finance/types/finance";
import type {
  BudgetInput,
  CsvImportInput,
  FinanceTransactionInput,
} from "@/features/finance/schemas/finance-schemas";

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

export function fetchFinanceWorkspace() {
  return request<FinanceWorkspaceData>("/api/finance");
}

export function createBudgetRequest(input: BudgetInput) {
  return request<FinanceMutationResponse>("/api/finance/budgets", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createTransactionRequest(input: FinanceTransactionInput) {
  return request<FinanceMutationResponse>("/api/finance/transactions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function importCsvRequest(input: CsvImportInput) {
  return request<FinanceMutationResponse>("/api/finance/import", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
