export type DashboardWorkspaceData = {
  summary: {
    habitsCompletedToday: number;
    inboxTasks: number;
    activeGoals: number;
    journalStreak: number;
    latestWeight: number | null;
    netCashflow: number;
  };
  charts: {
    habitsHeatmap: Array<{ date: string; count: number }>;
    healthSteps: Array<{ date: string; value: number }>;
    financeCashflow: Array<{ date: string; income: number; expense: number }>;
  };
};
