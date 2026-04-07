export type HabitFrequencyUnit = "daily" | "weekly";
export type HabitLogStatus = "completed" | "skipped" | "partial";

export type Habit = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  frequency_unit: HabitFrequencyUnit;
  frequency_interval: number;
  target_count: number;
  color: string | null;
  icon: string | null;
  starts_on: string;
  created_at: string;
  updated_at: string;
};

export type HabitLog = {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: string;
  completed_count: number;
  status: HabitLogStatus;
  notes: string | null;
  logged_at: string;
  created_at: string;
  updated_at: string;
};

export type HabitStreaks = {
  current: number;
  best: number;
};

export type HabitProgress = {
  completedToday: number;
  target: number;
  isCompleteToday: boolean;
};

export type HabitView = {
  habit: Habit;
  streaks: HabitStreaks;
  progress: HabitProgress;
  lastCompletedAt: string | null;
};

export type HabitHeatmapCell = {
  date: string;
  count: number;
};

export type HabitsDashboardData = {
  timeZone: string;
  today: string;
  summary: {
    totalHabits: number;
    completedToday: number;
    longestCurrentStreak: number;
    consistencyScore: number;
  };
  habits: HabitView[];
  heatmap: HabitHeatmapCell[];
};

export type HabitMutationResponse = {
  data: HabitsDashboardData;
  message: string;
};
