import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { Habit } from "@/features/habits/types/habit";
import type { Task } from "@/features/tasks/types/task";
import type {
  Goal,
  GoalHabitLink,
  GoalTaskLink,
  GoalsWorkspaceData,
  GoalView,
  Milestone,
} from "@/features/goals/types/goal";
import type {
  GoalFormInput,
  MilestoneFormInput,
} from "@/features/goals/schemas/goal-schemas";

function toIsoDate(value?: string) {
  return value ? `${value}T12:00:00.000Z` : null;
}

function computeProgress(goal: Goal, milestones: Milestone[]) {
  if (goal.target_value && goal.target_value > 0) {
    return Math.max(
      0,
      Math.min(100, Math.round((goal.current_value / goal.target_value) * 100)),
    );
  }

  if (!milestones.length) {
    return 0;
  }

  const completed = milestones.filter(
    (milestone) => milestone.completed_at,
  ).length;
  return Math.round((completed / milestones.length) * 100);
}

async function replaceGoalLinks(
  userId: string,
  goalId: string,
  habitIds: string[],
  taskIds: string[],
) {
  const supabase = await createClient();

  await Promise.all([
    supabase
      .from("goal_habits")
      .delete()
      .eq("goal_id", goalId)
      .eq("user_id", userId),
    supabase
      .from("goal_tasks")
      .delete()
      .eq("goal_id", goalId)
      .eq("user_id", userId),
  ]);

  if (habitIds.length) {
    const { error } = await supabase.from("goal_habits").insert(
      habitIds.map((habitId) => ({
        user_id: userId,
        goal_id: goalId,
        habit_id: habitId,
      })),
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  if (taskIds.length) {
    const { error } = await supabase.from("goal_tasks").insert(
      taskIds.map((taskId) => ({
        user_id: userId,
        goal_id: goalId,
        task_id: taskId,
      })),
    );

    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function getGoalsWorkspace(
  userId: string,
): Promise<GoalsWorkspaceData> {
  const supabase = await createClient();

  const [
    { data: goals, error: goalsError },
    { data: milestones, error: milestonesError },
    { data: goalHabits, error: goalHabitsError },
    { data: goalTasks, error: goalTasksError },
    { data: habits, error: habitsError },
    { data: tasks, error: tasksError },
  ] = await Promise.all([
    supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("target_date", { ascending: true })
      .returns<Goal[]>(),
    supabase
      .from("milestones")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .returns<Milestone[]>(),
    supabase
      .from("goal_habits")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .returns<GoalHabitLink[]>(),
    supabase
      .from("goal_tasks")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .returns<GoalTaskLink[]>(),
    supabase
      .from("habits")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .returns<Habit[]>(),
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .returns<Task[]>(),
  ]);

  const firstError =
    goalsError ||
    milestonesError ||
    goalHabitsError ||
    goalTasksError ||
    habitsError ||
    tasksError;

  if (firstError) {
    throw new Error(firstError.message);
  }

  const milestonesByGoal = new Map<string, Milestone[]>();
  for (const milestone of milestones ?? []) {
    const current = milestonesByGoal.get(milestone.goal_id) ?? [];
    milestonesByGoal.set(milestone.goal_id, [...current, milestone]);
  }

  const habitsMap = new Map((habits ?? []).map((habit) => [habit.id, habit]));
  const tasksMap = new Map((tasks ?? []).map((task) => [task.id, task]));
  const habitLinksByGoal = new Map<string, Habit[]>();
  const taskLinksByGoal = new Map<string, Task[]>();

  for (const link of goalHabits ?? []) {
    const habit = habitsMap.get(link.habit_id);
    if (!habit) continue;
    const current = habitLinksByGoal.get(link.goal_id) ?? [];
    habitLinksByGoal.set(link.goal_id, [...current, habit]);
  }

  for (const link of goalTasks ?? []) {
    const task = tasksMap.get(link.task_id);
    if (!task) continue;
    const current = taskLinksByGoal.get(link.goal_id) ?? [];
    taskLinksByGoal.set(link.goal_id, [...current, task]);
  }

  const goalViews: GoalView[] = (goals ?? []).map((goal) => {
    const goalMilestones = milestonesByGoal.get(goal.id) ?? [];
    return {
      goal,
      milestones: goalMilestones,
      linkedHabits: habitLinksByGoal.get(goal.id) ?? [],
      linkedTasks: taskLinksByGoal.get(goal.id) ?? [],
      progressPercent: computeProgress(goal, goalMilestones),
      completedMilestones: goalMilestones.filter((item) => item.completed_at)
        .length,
      totalMilestones: goalMilestones.length,
    };
  });

  return {
    summary: {
      activeGoals: goalViews.filter((item) => item.goal.status === "active")
        .length,
      completedGoals: goalViews.filter(
        (item) => item.goal.status === "completed",
      ).length,
      totalMilestones: goalViews.reduce(
        (sum, item) => sum + item.milestones.length,
        0,
      ),
      linkedExecutionItems: goalViews.reduce(
        (sum, item) => sum + item.linkedHabits.length + item.linkedTasks.length,
        0,
      ),
    },
    goals: goalViews,
    availableHabits: habits ?? [],
    availableTasks: (tasks ?? [])
      .filter((task) => !task.parent_task_id)
      .slice(0, 50),
  };
}

export async function createGoal(userId: string, input: GoalFormInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description?.trim() || null,
      status: input.status,
      start_date: input.startDate || null,
      target_date: input.targetDate || null,
      outcome_metric: input.outcomeMetric?.trim() || null,
      target_value:
        typeof input.targetValue === "number" ? input.targetValue : null,
      current_value: input.currentValue,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create goal.");
  }

  await replaceGoalLinks(userId, data.id, input.habitIds, input.taskIds);
}

export async function updateGoal(
  userId: string,
  goalId: string,
  input: GoalFormInput,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("goals")
    .update({
      title: input.title,
      description: input.description?.trim() || null,
      status: input.status,
      start_date: input.startDate || null,
      target_date: input.targetDate || null,
      outcome_metric: input.outcomeMetric?.trim() || null,
      target_value:
        typeof input.targetValue === "number" ? input.targetValue : null,
      current_value: input.currentValue,
    })
    .eq("id", goalId)
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  await replaceGoalLinks(userId, goalId, input.habitIds, input.taskIds);
}

export async function archiveGoal(userId: string, goalId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("goals")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", goalId)
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createMilestone(
  userId: string,
  input: MilestoneFormInput,
) {
  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("milestones")
    .select("sort_order")
    .eq("goal_id", input.goalId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle<{ sort_order: number }>();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const completedAt =
    input.targetValue !== undefined &&
    input.currentValue >= input.targetValue &&
    input.targetValue > 0
      ? new Date().toISOString()
      : null;

  const { error } = await supabase.from("milestones").insert({
    user_id: userId,
    goal_id: input.goalId,
    title: input.title,
    description: input.description?.trim() || null,
    target_value:
      typeof input.targetValue === "number" ? input.targetValue : null,
    current_value: input.currentValue,
    due_at: toIsoDate(input.dueAt),
    completed_at: completedAt,
    sort_order: (existing?.sort_order ?? -1) + 1,
  });

  if (error) {
    throw new Error(error.message);
  }
}
