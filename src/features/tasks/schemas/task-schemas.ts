import { z } from "zod";

export const projectFormSchema = z.object({
  name: z.string().trim().min(2, "Enter a project name."),
  description: z
    .string()
    .trim()
    .max(240, "Keep the description under 240 characters.")
    .optional(),
  color: z.string().trim().max(32).optional(),
});

export const taskFormSchema = z.object({
  title: z.string().trim().min(2, "Enter a task title."),
  description: z
    .string()
    .trim()
    .max(400, "Keep the description under 400 characters.")
    .optional(),
  bucket: z.enum(["inbox", "today", "upcoming", "someday"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueAt: z.string().optional(),
  projectId: z.string().uuid().optional().or(z.literal("")),
  parentTaskId: z.string().uuid().optional().or(z.literal("")),
  effortMinutes: z.coerce.number().int().min(0).max(1440).optional(),
});

export const taskMoveSchema = z.object({
  bucket: z.enum(["inbox", "today", "upcoming", "someday"]),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});

export type ProjectFormInput = z.infer<typeof projectFormSchema>;
export type TaskFormInput = z.infer<typeof taskFormSchema>;
export type TaskMoveInput = z.infer<typeof taskMoveSchema>;
