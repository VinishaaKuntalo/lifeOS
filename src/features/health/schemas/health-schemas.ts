import { z } from "zod";

export const healthMetricSchema = z.object({
  metricType: z.enum(["weight", "sleep", "water", "steps", "mood"]),
  metricDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  value: z.coerce.number().min(0),
  unit: z.string().trim().max(24).optional(),
  notes: z.string().trim().max(240).optional(),
});

export type HealthMetricInput = z.infer<typeof healthMetricSchema>;
