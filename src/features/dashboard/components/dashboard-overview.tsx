"use client";

import Link from "next/link";
import type { Route } from "next";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_ROUTES } from "@/lib/constants/routes";

import type { DashboardWorkspaceData } from "@/features/dashboard/types/dashboard";

type DashboardOverviewProps = {
  data: DashboardWorkspaceData;
};

export function DashboardOverview({ data }: DashboardOverviewProps) {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          href={APP_ROUTES.dashboardHabits}
          label="Habits done today"
          value={data.summary.habitsCompletedToday}
        />
        <SummaryCard
          href={APP_ROUTES.dashboardTasks}
          label="Inbox tasks"
          value={data.summary.inboxTasks}
        />
        <SummaryCard
          href={APP_ROUTES.dashboardGoals}
          label="Active goals"
          value={data.summary.activeGoals}
        />
        <SummaryCard
          href={APP_ROUTES.dashboardJournal}
          label="Journal streak"
          value={data.summary.journalStreak}
        />
        <SummaryCard
          href={APP_ROUTES.dashboardHealth}
          label="Latest weight"
          value={data.summary.latestWeight ?? "-"}
        />
        <SummaryCard
          href={APP_ROUTES.dashboardFinance}
          label="Net cashflow"
          value={data.summary.netCashflow.toFixed(2)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          href={APP_ROUTES.dashboardHabits}
          title="Habit completions (30 days)"
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.charts.habitsHeatmap}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148,163,184,0.16)"
              />
              <XAxis dataKey="date" hide />
              <YAxis />
              <Tooltip />
              <Area dataKey="count" stroke="#14b8a6" fill="#14b8a633" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard href={APP_ROUTES.dashboardHealth} title="Steps (30 days)">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.charts.healthSteps}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148,163,184,0.16)"
              />
              <XAxis dataKey="date" hide />
              <YAxis />
              <Tooltip />
              <Area dataKey="value" stroke="#38bdf8" fill="#38bdf833" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          href={APP_ROUTES.dashboardFinance}
          title="Income vs expense (30 days)"
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.charts.financeCashflow}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148,163,184,0.16)"
              />
              <XAxis dataKey="date" hide />
              <YAxis />
              <Tooltip />
              <Area
                dataKey="income"
                stackId="a"
                stroke="#22c55e"
                fill="#22c55e33"
              />
              <Area
                dataKey="expense"
                stackId="b"
                stroke="#f97316"
                fill="#f9731633"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </section>
  );
}

function SummaryCard({
  href,
  label,
  value,
}: {
  href: Route;
  label: string;
  value: string | number;
}) {
  return (
    <Link href={href} className="block">
      <Card className="border-border/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(8,15,32,0.98))] shadow-[0_16px_50px_rgba(8,145,178,0.08)] transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_60px_rgba(34,211,238,0.14)]">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold tracking-tight">{value}</div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ChartCard({
  href,
  title,
  children,
}: {
  href: Route;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="block">
      <Card className="border-border/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(8,15,32,0.98))] shadow-[0_16px_50px_rgba(8,145,178,0.08)] transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_60px_rgba(34,211,238,0.14)] xl:col-span-1">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </Link>
  );
}
