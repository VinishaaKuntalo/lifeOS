"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  archiveHabitRequest,
  createHabitRequest,
  fetchHabitsDashboard,
  toggleHabitLogRequest,
  updateHabitRequest,
} from "@/features/habits/api/habits-client";
import type { HabitsDashboardData } from "@/features/habits/types/habit";
import type {
  HabitFormInput,
  HabitLogInput,
} from "@/features/habits/schemas/habit-schemas";

export const habitsQueryKey = ["habits-dashboard"] as const;

function applyOptimisticToggle(
  data: HabitsDashboardData,
  habitId: string,
): HabitsDashboardData {
  const habits = data.habits.map((entry) => {
    if (entry.habit.id !== habitId) {
      return entry;
    }

    const nextCompleted = entry.progress.isCompleteToday
      ? 0
      : entry.habit.target_count;

    return {
      ...entry,
      progress: {
        ...entry.progress,
        completedToday: nextCompleted,
        isCompleteToday: nextCompleted >= entry.progress.target,
      },
      streaks: {
        ...entry.streaks,
        current: entry.progress.isCompleteToday
          ? Math.max(0, entry.streaks.current - 1)
          : entry.streaks.current + 1,
        best: entry.progress.isCompleteToday
          ? entry.streaks.best
          : Math.max(entry.streaks.best, entry.streaks.current + 1),
      },
      lastCompletedAt: entry.progress.isCompleteToday
        ? entry.lastCompletedAt
        : data.today,
    };
  });

  const completedToday = habits.filter(
    (habit) => habit.progress.isCompleteToday,
  ).length;

  return {
    ...data,
    habits,
    summary: {
      ...data.summary,
      completedToday,
      longestCurrentStreak: Math.max(
        0,
        ...habits.map((habit) => habit.streaks.current),
      ),
      consistencyScore: habits.length
        ? Math.round((completedToday / habits.length) * 100)
        : 0,
    },
    heatmap: data.heatmap.map((cell) =>
      cell.date === data.today
        ? {
            ...cell,
            count:
              cell.count +
              (habits.find((habit) => habit.habit.id === habitId)?.progress
                .isCompleteToday
                ? 1
                : -1),
          }
        : cell,
    ),
  };
}

export function useHabitsDashboard(initialData: HabitsDashboardData) {
  return useQuery({
    queryKey: habitsQueryKey,
    queryFn: fetchHabitsDashboard,
    initialData,
  });
}

export function useCreateHabitMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHabitRequest,
    onSuccess: (result) => {
      queryClient.setQueryData(habitsQueryKey, result.data);
      toast.success(result.message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateHabitMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      habitId,
      input,
    }: {
      habitId: string;
      input: HabitFormInput;
    }) => updateHabitRequest(habitId, input),
    onSuccess: (result) => {
      queryClient.setQueryData(habitsQueryKey, result.data);
      toast.success(result.message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useArchiveHabitMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveHabitRequest,
    onSuccess: (result) => {
      queryClient.setQueryData(habitsQueryKey, result.data);
      toast.success(result.message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useToggleHabitLogMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      habitId,
      input,
    }: {
      habitId: string;
      input: HabitLogInput;
    }) => toggleHabitLogRequest(habitId, input),
    onMutate: async ({ habitId }) => {
      await queryClient.cancelQueries({ queryKey: habitsQueryKey });
      const previous =
        queryClient.getQueryData<HabitsDashboardData>(habitsQueryKey);

      if (previous) {
        queryClient.setQueryData(
          habitsQueryKey,
          applyOptimisticToggle(previous, habitId),
        );
      }

      return { previous };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(habitsQueryKey, context.previous);
      }
      toast.error(error.message);
    },
    onSuccess: (result) => {
      queryClient.setQueryData(habitsQueryKey, result.data);
    },
  });
}
