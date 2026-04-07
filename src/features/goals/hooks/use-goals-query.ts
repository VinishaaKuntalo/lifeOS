"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  archiveGoalRequest,
  createGoalRequest,
  createMilestoneRequest,
  fetchGoalsWorkspace,
  updateGoalRequest,
} from "@/features/goals/api/goals-client";
import type { GoalsWorkspaceData } from "@/features/goals/types/goal";
import type { GoalFormInput } from "@/features/goals/schemas/goal-schemas";

export const goalsQueryKey = ["goals-workspace"] as const;

export function useGoalsWorkspace(initialData: GoalsWorkspaceData) {
  return useQuery({
    queryKey: goalsQueryKey,
    queryFn: fetchGoalsWorkspace,
    initialData,
  });
}

function buildMutation<TInput>(
  queryClient: ReturnType<typeof useQueryClient>,
  mutationFn: (
    input: TInput,
  ) => Promise<{ data: GoalsWorkspaceData; message: string }>,
) {
  return {
    mutationFn,
    onSuccess: (result: { data: GoalsWorkspaceData; message: string }) => {
      queryClient.setQueryData(goalsQueryKey, result.data);
      toast.success(result.message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  };
}

export function useCreateGoalMutation() {
  const queryClient = useQueryClient();
  return useMutation(buildMutation(queryClient, createGoalRequest));
}

export function useUpdateGoalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    ...buildMutation(
      queryClient,
      ({ goalId, input }: { goalId: string; input: GoalFormInput }) =>
        updateGoalRequest(goalId, input),
    ),
  });
}

export function useArchiveGoalMutation() {
  const queryClient = useQueryClient();
  return useMutation(buildMutation(queryClient, archiveGoalRequest));
}

export function useCreateMilestoneMutation() {
  const queryClient = useQueryClient();
  return useMutation(buildMutation(queryClient, createMilestoneRequest));
}
