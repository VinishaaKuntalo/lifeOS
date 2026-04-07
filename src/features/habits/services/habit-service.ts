import "server-only";

import {
  getTodayDateKey,
  startOfWeekDateKey,
  subtractDays,
} from "@/lib/utils/date";
import { logger } from "@/lib/logging/logger";
import { createClient } from "@/lib/supabase/server";

import type {
  Habit,
  HabitLog,
  HabitsDashboardData,
  HabitView,
} from "@/features/habits/types/habit";
import type {
  HabitFormInput,
  HabitLogInput,
} from "@/features/habits/schemas/habit-schemas";

type ProfileRow = {
  timezone: string | null;
};

const HEATMAP_WINDOW_DAYS = 90;

function groupLogsByHabit(logs: HabitLog[]) {
  return logs.reduce<Record<string, HabitLog[]>>((acc, log) => {
    acc[log.habit_id] ??= [];
    acc[log.habit_id]?.push(log);
    return acc;
  }, {});
}

function computeDailyStreak(logs: HabitLog[], today: string) {
  const dates = new Set(
    logs
      .filter((log) => log.completed_count > 0 && log.status !== "skipped")
      .map((log) => log.log_date),
  );

  let current = 0;
  let cursor = today;

  while (dates.has(cursor)) {
    current += 1;
    cursor = subtractDays(cursor, 1);
  }

  let best = 0;
  let running = 0;
  const sortedDates = Array.from(dates).sort();
  let previous: string | null = null;

  for (const date of sortedDates) {
    if (previous && subtractDays(date, 1) === previous) {
      running += 1;
    } else {
      running = 1;
    }

    previous = date;
    best = Math.max(best, running);
  }

  return { current, best };
}

function computeWeeklyStreak(
  logs: HabitLog[],
  today: string,
  targetCount: number,
) {
  const counts = logs.reduce<Record<string, number>>((acc, log) => {
    if (log.completed_count <= 0 || log.status === "skipped") {
      return acc;
    }

    const weekKey = startOfWeekDateKey(log.log_date);
    acc[weekKey] = (acc[weekKey] ?? 0) + log.completed_count;
    return acc;
  }, {});

  let current = 0;
  let cursor = startOfWeekDateKey(today);

  while ((counts[cursor] ?? 0) >= targetCount) {
    current += 1;
    cursor = subtractDays(cursor, 7);
  }

  const sortedWeeks = Object.keys(counts).sort();
  let best = 0;
  let running = 0;
  let previous: string | null = null;

  for (const week of sortedWeeks) {
    const qualifies = (counts[week] ?? 0) >= targetCount;

    if (!qualifies) {
      running = 0;
      previous = week;
      continue;
    }

    if (previous && subtractDays(week, 7) === previous) {
      running += 1;
    } else {
      running = 1;
    }

    previous = week;
    best = Math.max(best, running);
  }

  return { current, best };
}

function computeHabitView(
  habit: Habit,
  logs: HabitLog[],
  today: string,
): HabitView {
  const sortedLogs = [...logs].sort((a, b) =>
    a.log_date.localeCompare(b.log_date),
  );
  const todayLogs = sortedLogs.filter((log) => log.log_date === today);
  const completedToday = todayLogs.reduce(
    (sum, log) => sum + log.completed_count,
    0,
  );
  const progressTarget =
    habit.frequency_unit === "daily" ? habit.target_count : habit.target_count;
  const streaks =
    habit.frequency_unit === "daily"
      ? computeDailyStreak(sortedLogs, today)
      : computeWeeklyStreak(sortedLogs, today, habit.target_count);

  return {
    habit,
    streaks,
    progress: {
      completedToday,
      target: progressTarget,
      isCompleteToday: completedToday >= progressTarget,
    },
    lastCompletedAt:
      [...sortedLogs]
        .reverse()
        .find((log) => log.completed_count > 0 && log.status !== "skipped")
        ?.log_date ?? null,
  };
}

function computeConsistency(habits: HabitView[]) {
  if (!habits.length) {
    return 0;
  }

  const completed = habits.filter(
    (habit) => habit.progress.isCompleteToday,
  ).length;
  return Math.round((completed / habits.length) * 100);
}

function buildHeatmap(logs: HabitLog[], today: string) {
  const counts = logs.reduce<Record<string, number>>((acc, log) => {
    if (log.completed_count <= 0 || log.status === "skipped") {
      return acc;
    }

    acc[log.log_date] = (acc[log.log_date] ?? 0) + log.completed_count;
    return acc;
  }, {});

  const cells: HabitsDashboardData["heatmap"] = [];
  for (let i = HEATMAP_WINDOW_DAYS - 1; i >= 0; i -= 1) {
    const date = subtractDays(today, i);
    cells.push({
      date,
      count: counts[date] ?? 0,
    });
  }
  return cells;
}

async function getUserTimezone(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("user_id", userId)
    .single<ProfileRow>();

  if (error) {
    logger.warn("Falling back to UTC timezone", {
      userId,
      error: error.message,
    });
    return "UTC";
  }

  return data?.timezone ?? "UTC";
}

export async function getHabitsDashboard(
  userId: string,
): Promise<HabitsDashboardData> {
  const supabase = await createClient();
  const timeZone = await getUserTimezone(userId);
  const today = getTodayDateKey(timeZone);
  const logWindowStart = subtractDays(today, HEATMAP_WINDOW_DAYS + 30);

  const [
    { data: habits, error: habitsError },
    { data: logs, error: logsError },
  ] = await Promise.all([
    supabase
      .from("habits")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .returns<Habit[]>(),
    supabase
      .from("habit_logs")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .gte("log_date", logWindowStart)
      .order("log_date", { ascending: true })
      .returns<HabitLog[]>(),
  ]);

  if (habitsError) {
    throw new Error(habitsError.message);
  }

  if (logsError) {
    throw new Error(logsError.message);
  }

  const logsByHabit = groupLogsByHabit(logs ?? []);
  const habitViews = (habits ?? []).map((habit) =>
    computeHabitView(habit, logsByHabit[habit.id] ?? [], today),
  );

  return {
    timeZone,
    today,
    summary: {
      totalHabits: habitViews.length,
      completedToday: habitViews.filter(
        (habit) => habit.progress.isCompleteToday,
      ).length,
      longestCurrentStreak: Math.max(
        0,
        ...habitViews.map((habit) => habit.streaks.current),
      ),
      consistencyScore: computeConsistency(habitViews),
    },
    habits: habitViews,
    heatmap: buildHeatmap(logs ?? [], today),
  };
}

export async function createHabit(userId: string, input: HabitFormInput) {
  const supabase = await createClient();
  const payload = {
    user_id: userId,
    name: input.name,
    description: input.description?.trim() || null,
    frequency_unit: input.frequencyUnit,
    frequency_interval: input.frequencyInterval,
    target_count: input.targetCount,
    color: input.color?.trim() || null,
  };

  const { error } = await supabase.from("habits").insert(payload);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateHabit(
  userId: string,
  habitId: string,
  input: HabitFormInput,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("habits")
    .update({
      name: input.name,
      description: input.description?.trim() || null,
      frequency_unit: input.frequencyUnit,
      frequency_interval: input.frequencyInterval,
      target_count: input.targetCount,
      color: input.color?.trim() || null,
    })
    .eq("id", habitId)
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }
}

export async function archiveHabit(userId: string, habitId: string) {
  const supabase = await createClient();
  const deletedAt = new Date().toISOString();
  const { error } = await supabase
    .from("habits")
    .update({
      deleted_at: deletedAt,
      archived_at: deletedAt,
    })
    .eq("id", habitId)
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }
}

export async function upsertHabitLog(
  userId: string,
  habitId: string,
  input: HabitLogInput,
) {
  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("habit_logs")
    .select("id, completed_count")
    .eq("habit_id", habitId)
    .eq("user_id", userId)
    .eq("log_date", input.logDate)
    .is("deleted_at", null)
    .maybeSingle<{ id: string; completed_count: number }>();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    const nextCount = existing.completed_count > 0 ? 0 : input.completedCount;
    const { error } = await supabase
      .from("habit_logs")
      .update({
        completed_count: nextCount,
        status: nextCount > 0 ? "completed" : "skipped",
      })
      .eq("id", existing.id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await supabase.from("habit_logs").insert({
    user_id: userId,
    habit_id: habitId,
    log_date: input.logDate,
    completed_count: input.completedCount,
    status: input.completedCount > 0 ? "completed" : "skipped",
  });

  if (error) {
    throw new Error(error.message);
  }
}
