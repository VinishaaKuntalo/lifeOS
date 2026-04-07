"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  fetchHealthWorkspace,
  upsertHealthMetricRequest,
} from "@/features/health/api/health-client";
import type { HealthWorkspaceData } from "@/features/health/types/health";

export const healthQueryKey = ["health-workspace"] as const;

export function useHealthWorkspace(initialData: HealthWorkspaceData) {
  return useQuery({
    queryKey: healthQueryKey,
    queryFn: fetchHealthWorkspace,
    initialData,
  });
}

export function useUpsertHealthMetricMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertHealthMetricRequest,
    onSuccess: (result) => {
      queryClient.setQueryData(healthQueryKey, result.data);
      toast.success(result.message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
