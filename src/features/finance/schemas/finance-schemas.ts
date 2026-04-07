import { z } from "zod";

export const budgetSchema = z.object({
  name: z.string().trim().min(2, "Enter a budget name."),
  category: z.string().trim().min(2, "Enter a category."),
  amount: z.coerce.number().min(0),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const financeTransactionSchema = z.object({
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.coerce.number().min(0),
  transactionType: z.enum(["income", "expense", "transfer"]),
  category: z.string().trim().min(2, "Enter a category."),
  merchant: z.string().trim().max(80).optional(),
  accountName: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(240).optional(),
  budgetId: z.string().uuid().optional().or(z.literal("")),
  isRecurring: z.boolean().default(false),
  recurrenceFrequency: z
    .enum(["daily", "weekly", "monthly", "yearly"])
    .optional(),
  recurrenceInterval: z.coerce.number().int().min(1).optional(),
  nextOccursOn: z.string().optional(),
});

export const csvImportSchema = z.object({
  csv: z.string().min(1, "Provide CSV contents."),
});

export type BudgetInput = z.infer<typeof budgetSchema>;
export type FinanceTransactionInput = z.infer<typeof financeTransactionSchema>;
export type CsvImportInput = z.infer<typeof csvImportSchema>;
