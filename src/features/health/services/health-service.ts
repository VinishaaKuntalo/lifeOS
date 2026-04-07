import "server-only";

import { eachDateKeyInRange, subtractDays } from "@/lib/utils/date";
import { createClient } from "@/lib/supabase/server";

import type {
  HealthChartPoint,
  HealthMetric,
  HealthMetricType,
  HealthWorkspaceData,
} from "@/features/health/types/health";
import type { HealthMetricInput } from "@/features/health/schemas/health-schemas";

type ProfileRow = {
  height_cm: number | null;
};

const windows = ["7", "30", "90"] as const;

function average(values: number[]) {
  if (!values.length) {
    return null;
  }

  return (
    Math.round(
      (values.reduce((sum, value) => sum + value, 0) / values.length) * 10,
    ) / 10
  );
}

function buildSeries(
  metrics: HealthMetric[],
  metricType: HealthMetricType,
  window: (typeof windows)[number],
  today: string,
): HealthChartPoint[] {
  const start = subtractDays(today, Number(window) - 1);
  const relevant = metrics.filter(
    (metric) => metric.metric_type === metricType,
  );
  const byDate = new Map(
    relevant.map((metric) => [metric.metric_date, metric.value_numeric]),
  );

  return eachDateKeyInRange(start, today).map((date) => ({
    date,
    value: byDate.get(date) ?? 0,
  }));
}

function getLatest(metrics: HealthMetric[], metricType: HealthMetricType) {
  return (
    metrics.find((metric) => metric.metric_type === metricType)
      ?.value_numeric ?? null
  );
}

export async function getHealthWorkspace(
  userId: string,
): Promise<HealthWorkspaceData> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: metrics, error: metricsError }, { data: profile }] =
    await Promise.all([
      supabase
        .from("health_metrics")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .gte("metric_date", subtractDays(today, 90))
        .order("metric_date", { ascending: false })
        .returns<HealthMetric[]>(),
      supabase
        .from("profiles")
        .select("height_cm")
        .eq("user_id", userId)
        .single<ProfileRow>(),
    ]);

  if (metricsError) {
    throw new Error(metricsError.message);
  }

  const rows = metrics ?? [];
  const latestWeight = getLatest(rows, "weight");
  const heightMeters = profile?.height_cm ? profile.height_cm / 100 : null;
  const bmi =
    latestWeight && heightMeters
      ? latestWeight / (heightMeters * heightMeters)
      : null;

  return {
    summary: {
      latestWeight,
      averageSleep: average(
        rows
          .filter((metric) => metric.metric_type === "sleep")
          .map((metric) => metric.value_numeric),
      ),
      averageWater: average(
        rows
          .filter((metric) => metric.metric_type === "water")
          .map((metric) => metric.value_numeric),
      ),
      averageSteps: average(
        rows
          .filter((metric) => metric.metric_type === "steps")
          .map((metric) => metric.value_numeric),
      ),
      averageMood: average(
        rows
          .filter((metric) => metric.metric_type === "mood")
          .map((metric) => metric.value_numeric),
      ),
      bmi: bmi ? Math.round(bmi * 10) / 10 : null,
    },
    metrics: rows,
    charts: {
      weight: {
        7: buildSeries(rows, "weight", "7", today),
        30: buildSeries(rows, "weight", "30", today),
        90: buildSeries(rows, "weight", "90", today),
      },
      sleep: {
        7: buildSeries(rows, "sleep", "7", today),
        30: buildSeries(rows, "sleep", "30", today),
        90: buildSeries(rows, "sleep", "90", today),
      },
      water: {
        7: buildSeries(rows, "water", "7", today),
        30: buildSeries(rows, "water", "30", today),
        90: buildSeries(rows, "water", "90", today),
      },
      steps: {
        7: buildSeries(rows, "steps", "7", today),
        30: buildSeries(rows, "steps", "30", today),
        90: buildSeries(rows, "steps", "90", today),
      },
      mood: {
        7: buildSeries(rows, "mood", "7", today),
        30: buildSeries(rows, "mood", "30", today),
        90: buildSeries(rows, "mood", "90", today),
      },
    },
  };
}

export async function upsertHealthMetric(
  userId: string,
  input: HealthMetricInput,
) {
  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("health_metrics")
    .select("id")
    .eq("user_id", userId)
    .eq("metric_type", input.metricType)
    .eq("metric_date", input.metricDate)
    .is("deleted_at", null)
    .maybeSingle<{ id: string }>();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const payload = {
    value_numeric: input.value,
    unit: input.unit?.trim() || null,
    notes: input.notes?.trim() || null,
  };

  if (existing?.id) {
    const { error } = await supabase
      .from("health_metrics")
      .update(payload)
      .eq("id", existing.id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await supabase.from("health_metrics").insert({
    user_id: userId,
    metric_type: input.metricType,
    metric_date: input.metricDate,
    ...payload,
  });

  if (error) {
    throw new Error(error.message);
  }
}
