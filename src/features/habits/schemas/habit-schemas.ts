import { z } from "zod";

export const habitFormSchema = z.object({
  name: z.string().trim().min(2, "Enter a habit name."),
  description: z
    .string()
    .trim()
    .max(240, "Keep the description under 240 characters.")
    .optional(),
  frequencyUnit: z.enum(["daily", "weekly"]),
  frequencyInterval: z.coerce.number().int().min(1).max(30),
  targetCount: z.coerce.number().int().min(1).max(30),
  color: z.string().trim().max(32).optional(),
});

export const habitLogSchema = z.object({
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completedCount: z.coerce.number().int().min(0).max(100).default(1),
});

export type HabitFormInput = z.infer<typeof habitFormSchema>;
export type HabitLogInput = z.infer<typeof habitLogSchema>;
