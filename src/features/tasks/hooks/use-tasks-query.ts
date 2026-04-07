"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  archiveTaskRequest,
  createProjectRequest,
  createTaskRequest,
  fetchTasksWorkspace,
  moveTaskRequest,
  updateTaskRequest,
} from "@/features/tasks/api/tasks-client";
import type { TasksWorkspaceData } from "@/features/tasks/types/task";
import type {
  TaskFormInput,
  TaskMoveInput,
} from "@/features/tasks/schemas/task-schemas";

export const tasksQueryKey = ["tasks-workspace"] as const;

export function useTasksWorkspace(initialData: TasksWorkspaceData) {
  return useQuery({
    queryKey: tasksQueryKey,
    queryFn: fetchTasksWorkspace,
    initialData,
  });
}

function buildMutation<TInput>(
  queryClient: ReturnType<typeof useQueryClient>,
  mutationFn: (
    input: TInput,
  ) => Promise<{ data: TasksWorkspaceData; message: string }>,
) {
  return {
    mutationFn,
    onSuccess: (result: { data: TasksWorkspaceData; message: string }) => {
      queryClient.setQueryData(tasksQueryKey, result.data);
      toast.success(result.message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  };
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation(buildMutation(queryClient, createTaskRequest));
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    ...buildMutation(
      queryClient,
      ({ taskId, input }: { taskId: string; input: TaskFormInput }) =>
        updateTaskRequest(taskId, input),
    ),
  });
}

export function useMoveTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    ...buildMutation(
      queryClient,
      ({ taskId, input }: { taskId: string; input: TaskMoveInput }) =>
        moveTaskRequest(taskId, input),
    ),
  });
}

export function useArchiveTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation(buildMutation(queryClient, archiveTaskRequest));
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation(buildMutation(queryClient, createProjectRequest));
}
