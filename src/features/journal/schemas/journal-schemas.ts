import { z } from "zod";

export const journalEntrySchema = z.object({
  id: z.string().uuid().optional(),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z
    .string()
    .trim()
    .max(120, "Keep the title under 120 characters.")
    .optional(),
  contentJson: z.record(z.any()).default({}),
  contentText: z.string().trim().max(50_000, "Entry is too large.").default(""),
  mood: z
    .enum(["great", "good", "neutral", "low", "bad"])
    .nullable()
    .optional(),
});

export type JournalEntryInput = z.infer<typeof journalEntrySchema>;
