export type HealthMetricType = "weight" | "sleep" | "water" | "steps" | "mood";

export type HealthMetric = {
  id: string;
  user_id: string;
  metric_type: HealthMetricType;
  metric_date: string;
  value_numeric: number;
  unit: string | null;
  notes: string | null;
  recorded_at: string;
  created_at: string;
  updated_at: string;
};

export type HealthChartPoint = {
  date: string;
  value: number;
};

export type HealthWorkspaceData = {
  summary: {
    latestWeight: number | null;
    averageSleep: number | null;
    averageWater: number | null;
    averageSteps: number | null;
    averageMood: number | null;
    bmi: number | null;
  };
  metrics: HealthMetric[];
  charts: Record<
    HealthMetricType,
    Record<"7" | "30" | "90", HealthChartPoint[]>
  >;
};

export type HealthMutationResponse = {
  data: HealthWorkspaceData;
  message: string;
};
