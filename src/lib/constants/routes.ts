import type { Route } from "next";

export const APP_ROUTES = {
  home: "/" as Route,
  dashboard: "/dashboard" as Route,
  dashboardHabits: "/dashboard/habits" as Route,
  dashboardTasks: "/dashboard/tasks" as Route,
  dashboardGoals: "/dashboard/goals" as Route,
  dashboardJournal: "/dashboard/journal" as Route,
  dashboardHealth: "/dashboard/health" as Route,
  dashboardFinance: "/dashboard/finance" as Route,
  dashboardInsights: "/dashboard/insights" as Route,
  dashboardSettings: "/dashboard/settings" as Route,
  login: "/login" as Route,
  signup: "/signup" as Route,
  authCallback: "/auth/callback" as Route,
} as const;
