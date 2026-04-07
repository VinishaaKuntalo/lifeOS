import type { Habit } from "@/features/habits/types/habit";
import type { Task } from "@/features/tasks/types/task";

export type GoalStatus =
  | "draft"
  | "active"
  | "at_risk"
  | "completed"
  | "archived";

export type Goal = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: GoalStatus;
  target_date: string | null;
  start_date: string | null;
  outcome_metric: string | null;
  target_value: number | null;
  current_value: number;
  created_at: string;
  updated_at: string;
};

export type Milestone = {
  id: string;
  user_id: string;
  goal_id: string;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number;
  due_at: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type GoalHabitLink = {
  id: string;
  user_id: string;
  goal_id: string;
  habit_id: string;
  created_at: string;
  updated_at: string;
};

export type GoalTaskLink = {
  id: string;
  user_id: string;
  goal_id: string;
  task_id: string;
  created_at: string;
  updated_at: string;
};

export type GoalView = {
  goal: Goal;
  milestones: Milestone[];
  linkedHabits: Habit[];
  linkedTasks: Task[];
  progressPercent: number;
  completedMilestones: number;
  totalMilestones: number;
};

export type GoalsWorkspaceData = {
  summary: {
    activeGoals: number;
    completedGoals: number;
    totalMilestones: number;
    linkedExecutionItems: number;
  };
  goals: GoalView[];
  availableHabits: Habit[];
  availableTasks: Task[];
};

export type GoalMutationResponse = {
  data: GoalsWorkspaceData;
  message: string;
};
