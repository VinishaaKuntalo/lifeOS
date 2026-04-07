"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createBudgetRequest,
  createTransactionRequest,
  fetchFinanceWorkspace,
  importCsvRequest,
} from "@/features/finance/api/finance-client";
import type { FinanceWorkspaceData } from "@/features/finance/types/finance";

export const financeQueryKey = ["finance-workspace"] as const;

export function useFinanceWorkspace(initialData: FinanceWorkspaceData) {
  return useQuery({
    queryKey: financeQueryKey,
    queryFn: fetchFinanceWorkspace,
    initialData,
  });
}

function buildMutation<TInput>(
  queryClient: ReturnType<typeof useQueryClient>,
  mutationFn: (
    input: TInput,
  ) => Promise<{ data: FinanceWorkspaceData; message: string }>,
) {
  return {
    mutationFn,
    onSuccess: (result: { data: FinanceWorkspaceData; message: string }) => {
      queryClient.setQueryData(financeQueryKey, result.data);
      toast.success(result.message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  };
}

export function useCreateBudgetMutation() {
  const queryClient = useQueryClient();
  return useMutation(buildMutation(queryClient, createBudgetRequest));
}

export function useCreateTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation(buildMutation(queryClient, createTransactionRequest));
}

export function useImportCsvMutation() {
  const queryClient = useQueryClient();
  return useMutation(buildMutation(queryClient, importCsvRequest));
}
