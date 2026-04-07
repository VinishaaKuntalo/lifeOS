import { z } from "zod";

export const goalFormSchema = z.object({
  title: z.string().trim().min(2, "Enter a goal title."),
  description: z
    .string()
    .trim()
    .max(400, "Keep the description under 400 characters.")
    .optional(),
  status: z.enum(["draft", "active", "at_risk", "completed", "archived"]),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
  outcomeMetric: z
    .string()
    .trim()
    .max(80, "Keep the metric label under 80 characters.")
    .optional(),
  targetValue: z.coerce.number().min(0).optional(),
  currentValue: z.coerce.number().min(0).default(0),
  habitIds: z.array(z.string().uuid()).default([]),
  taskIds: z.array(z.string().uuid()).default([]),
});

export const milestoneFormSchema = z.object({
  goalId: z.string().uuid(),
  title: z.string().trim().min(2, "Enter a milestone title."),
  description: z
    .string()
    .trim()
    .max(240, "Keep the description under 240 characters.")
    .optional(),
  targetValue: z.coerce.number().min(0).optional(),
  currentValue: z.coerce.number().min(0).default(0),
  dueAt: z.string().optional(),
});

export type GoalFormInput = z.infer<typeof goalFormSchema>;
export type MilestoneFormInput = z.infer<typeof milestoneFormSchema>;
