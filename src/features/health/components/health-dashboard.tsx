"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  healthMetricSchema,
  type HealthMetricInput,
} from "@/features/health/schemas/health-schemas";
import type {
  HealthMetricType,
  HealthWorkspaceData,
} from "@/features/health/types/health";
import {
  useHealthWorkspace,
  useUpsertHealthMetricMutation,
} from "@/features/health/hooks/use-health-query";

const metricOptions: Array<{
  value: HealthMetricType;
  label: string;
  unit: string;
}> = [
  { value: "weight", label: "Weight", unit: "kg" },
  { value: "sleep", label: "Sleep", unit: "hours" },
  { value: "water", label: "Water", unit: "liters" },
  { value: "steps", label: "Steps", unit: "steps" },
  { value: "mood", label: "Mood", unit: "1-5" },
];

type HealthDashboardProps = {
  initialData: HealthWorkspaceData;
};

export function HealthDashboard({ initialData }: HealthDashboardProps) {
  const { data, isError, refetch } = useHealthWorkspace(initialData);
  const mutation = useUpsertHealthMetricMutation();
  const [selectedMetric, setSelectedMetric] =
    useState<HealthMetricType>("weight");
  const [selectedWindow, setSelectedWindow] = useState<"7" | "30" | "90">("30");

  const form = useForm<HealthMetricInput>({
    resolver: zodResolver(healthMetricSchema),
    defaultValues: {
      metricType: "weight",
      metricDate: new Date().toISOString().slice(0, 10),
      value: 0,
      unit: "kg",
      notes: "",
    },
  });

  const currentOption = useMemo(
    () =>
      metricOptions.find((option) => option.value === form.watch("metricType")),
    [form],
  );

  const chartData = data?.charts[selectedMetric][selectedWindow] ?? [];

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync(values);
  });

  if (isError || !data) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle>Unable to load health metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load your health workspace right now.
          </p>
          <Button onClick={() => void refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Latest weight"
          value={data.summary.latestWeight ?? "-"}
        />
        <SummaryCard
          label="Avg sleep"
          value={data.summary.averageSleep ?? "-"}
        />
        <SummaryCard
          label="Avg water"
          value={data.summary.averageWater ?? "-"}
        />
        <SummaryCard
          label="Avg steps"
          value={data.summary.averageSteps ?? "-"}
        />
        <SummaryCard label="BMI" value={data.summary.bmi ?? "-"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle>Log metric</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label>Metric</Label>
                <select
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  {...form.register("metricType")}
                >
                  {metricOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" {...form.register("metricDate")} />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input
                    {...form.register("unit")}
                    placeholder={currentOption?.unit}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input type="number" step="0.1" {...form.register("value")} />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  {...form.register("notes")}
                  placeholder="Optional notes"
                />
              </div>
              <Button type="submit" disabled={mutation.isPending}>
                Save metric
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Trend chart</CardTitle>
            <div className="flex gap-2">
              <select
                className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                value={selectedMetric}
                onChange={(event) =>
                  setSelectedMetric(event.target.value as HealthMetricType)
                }
              >
                {metricOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                value={selectedWindow}
                onChange={(event) =>
                  setSelectedWindow(event.target.value as "7" | "30" | "90")
                }
              >
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148,163,184,0.16)"
                  />
                  <XAxis dataKey="date" hide={selectedWindow === "90"} />
                  <YAxis />
                  <Tooltip />
                  <Line
                    dataKey="value"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
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
