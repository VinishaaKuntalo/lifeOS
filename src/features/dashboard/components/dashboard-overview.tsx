"use client";

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

import type { DashboardWorkspaceData } from "@/features/dashboard/types/dashboard";

type DashboardOverviewProps = {
  data: DashboardWorkspaceData;
};

export function DashboardOverview({ data }: DashboardOverviewProps) {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="Habits done today"
          value={data.summary.habitsCompletedToday}
        />
        <SummaryCard label="Inbox tasks" value={data.summary.inboxTasks} />
        <SummaryCard label="Active goals" value={data.summary.activeGoals} />
        <SummaryCard
          label="Journal streak"
          value={data.summary.journalStreak}
        />
        <SummaryCard
          label="Latest weight"
          value={data.summary.latestWeight ?? "-"}
        />
        <SummaryCard
          label="Net cashflow"
          value={data.summary.netCashflow.toFixed(2)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Habit completions (30 days)">
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
        <ChartCard title="Steps (30 days)">
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
        <ChartCard title="Income vs expense (30 days)">
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
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Card className="border-border/70 bg-card/70">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/70 bg-card/70 xl:col-span-1">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
