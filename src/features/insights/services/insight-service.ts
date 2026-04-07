import "server-only";

import { getFinanceWorkspace } from "@/features/finance/services/finance-service";
import { getHabitsDashboard } from "@/features/habits/services/habit-service";
import { getHealthWorkspace } from "@/features/health/services/health-service";
import { getJournalWorkspace } from "@/features/journal/services/journal-service";
import { getTasksWorkspace } from "@/features/tasks/services/task-service";

import type { InsightDigest } from "@/features/insights/types/insight";

export interface InsightProvider {
  generateWeeklyDigest(userId: string): Promise<InsightDigest>;
}

class RuleBasedInsightProvider implements InsightProvider {
  async generateWeeklyDigest(userId: string): Promise<InsightDigest> {
    const [habits, tasks, journal, health, finance] = await Promise.all([
      getHabitsDashboard(userId),
      getTasksWorkspace(userId),
      getJournalWorkspace(userId),
      getHealthWorkspace(userId),
      getFinanceWorkspace(userId),
    ]);

    const wins: string[] = [];
    const patterns: string[] = [];
    const suggestions: string[] = [];

    if (habits.summary.completedToday > 0) {
      wins.push(
        `You completed ${habits.summary.completedToday} habits today and your longest live streak is ${habits.summary.longestCurrentStreak}.`,
      );
    }

    if (journal.summary.currentStreak >= 3) {
      wins.push(
        `Your journal streak is at ${journal.summary.currentStreak} days.`,
      );
    }

    if (tasks.summary.inboxCount > 5) {
      patterns.push(
        `Your inbox currently has ${tasks.summary.inboxCount} tasks waiting to be clarified.`,
      );
      suggestions.push(
        "Schedule a short inbox processing block to move capture into projects or dates.",
      );
    }

    if ((health.summary.averageSleep ?? 0) < 7) {
      patterns.push("Sleep averages are trending under 7 hours.");
      suggestions.push(
        "Set an earlier wind-down reminder and log sleep consistently for the next week.",
      );
    }

    if (finance.summary.netCashflow < 0) {
      patterns.push(
        "Expenses are currently outpacing income in the tracked period.",
      );
      suggestions.push(
        "Review your largest expense categories and compare them against active budgets.",
      );
    }

    if (!wins.length) {
      wins.push(
        "You have data across multiple areas now, which is enough to begin tracking trends week over week.",
      );
    }

    if (!patterns.length) {
      patterns.push(
        "Your current data does not show a strong negative pattern yet.",
      );
    }

    if (!suggestions.length) {
      suggestions.push(
        "Keep logging daily activity this week so the next digest can surface stronger patterns.",
      );
    }

    return { wins, patterns, suggestions };
  }
}

export const insightProvider: InsightProvider = new RuleBasedInsightProvider();
