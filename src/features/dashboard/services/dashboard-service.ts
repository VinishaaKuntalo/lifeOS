import "server-only";

import { eachDateKeyInRange, subtractDays } from "@/lib/utils/date";

import { getFinanceWorkspace } from "@/features/finance/services/finance-service";
import { getGoalsWorkspace } from "@/features/goals/services/goal-service";
import { getHabitsDashboard } from "@/features/habits/services/habit-service";
import { getHealthWorkspace } from "@/features/health/services/health-service";
import { getJournalWorkspace } from "@/features/journal/services/journal-service";
import { getTasksWorkspace } from "@/features/tasks/services/task-service";

import type { DashboardWorkspaceData } from "@/features/dashboard/types/dashboard";

export async function getDashboardWorkspace(
  userId: string,
): Promise<DashboardWorkspaceData> {
  const [habits, tasks, goals, journal, health, finance] = await Promise.all([
    getHabitsDashboard(userId),
    getTasksWorkspace(userId),
    getGoalsWorkspace(userId),
    getJournalWorkspace(userId),
    getHealthWorkspace(userId),
    getFinanceWorkspace(userId),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const start = subtractDays(today, 29);
  const financeByDate = eachDateKeyInRange(start, today).map((date) => {
    const dayTransactions = finance.transactions.filter(
      (transaction) => transaction.occurred_on === date,
    );

    return {
      date,
      income: dayTransactions
        .filter((transaction) => transaction.transaction_type === "income")
        .reduce((sum, item) => sum + item.amount, 0),
      expense: dayTransactions
        .filter((transaction) => transaction.transaction_type === "expense")
        .reduce((sum, item) => sum + item.amount, 0),
    };
  });

  return {
    summary: {
      habitsCompletedToday: habits.summary.completedToday,
      inboxTasks: tasks.summary.inboxCount,
      activeGoals: goals.summary.activeGoals,
      journalStreak: journal.summary.currentStreak,
      latestWeight: health.summary.latestWeight,
      netCashflow: finance.summary.netCashflow,
    },
    charts: {
      habitsHeatmap: habits.heatmap.slice(-30),
      healthSteps: health.charts.steps["30"],
      financeCashflow: financeByDate,
    },
  };
}
