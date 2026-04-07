import "server-only";

import { createClient } from "@/lib/supabase/server";

import type {
  Budget,
  FinanceTransaction,
  FinanceWorkspaceData,
} from "@/features/finance/types/finance";
import type {
  BudgetInput,
  CsvImportInput,
  FinanceTransactionInput,
} from "@/features/finance/schemas/finance-schemas";

function isoDate(value: string) {
  return value;
}

function parseCsv(csv: string) {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) {
    return [];
  }

  const [, ...rows] = lines;
  return rows.map((row) => {
    const [
      occurredOn,
      amount,
      transactionType,
      category,
      merchant,
      accountName,
      notes,
    ] = row.split(",").map((item) => item.trim());

    return {
      occurredOn,
      amount: Number(amount),
      transactionType,
      category,
      merchant,
      accountName,
      notes,
    };
  });
}

export async function getFinanceWorkspace(
  userId: string,
): Promise<FinanceWorkspaceData> {
  const supabase = await createClient();
  const [
    { data: budgets, error: budgetsError },
    { data: transactions, error: transactionsError },
  ] = await Promise.all([
    supabase
      .from("budgets")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("period_start", { ascending: false })
      .returns<Budget[]>(),
    supabase
      .from("finance_transactions")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("occurred_on", { ascending: false })
      .returns<FinanceTransaction[]>(),
  ]);

  if (budgetsError) {
    throw new Error(budgetsError.message);
  }

  if (transactionsError) {
    throw new Error(transactionsError.message);
  }

  const budgetRows = budgets ?? [];
  const transactionRows = transactions ?? [];
  const totalIncome = transactionRows
    .filter((item) => item.transaction_type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = transactionRows
    .filter((item) => item.transaction_type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const totalBudgeted = budgetRows.reduce((sum, item) => sum + item.amount, 0);

  return {
    summary: {
      totalIncome,
      totalExpense,
      netCashflow: totalIncome - totalExpense,
      totalBudgeted,
      budgetUtilizationPercent:
        totalBudgeted > 0
          ? Math.round((totalExpense / totalBudgeted) * 100)
          : 0,
    },
    budgets: budgetRows,
    transactions: transactionRows,
  };
}

export async function createBudget(userId: string, input: BudgetInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("budgets").insert({
    user_id: userId,
    name: input.name,
    category: input.category,
    amount: input.amount,
    period_start: input.periodStart,
    period_end: input.periodEnd,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function createTransaction(
  userId: string,
  input: FinanceTransactionInput,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("finance_transactions").insert({
    user_id: userId,
    budget_id: input.budgetId || null,
    occurred_on: isoDate(input.occurredOn),
    amount: input.amount,
    transaction_type: input.transactionType,
    category: input.category,
    merchant: input.merchant?.trim() || null,
    account_name: input.accountName?.trim() || null,
    notes: input.notes?.trim() || null,
    is_recurring: input.isRecurring,
    recurrence_frequency: input.isRecurring
      ? (input.recurrenceFrequency ?? null)
      : null,
    recurrence_interval: input.isRecurring
      ? (input.recurrenceInterval ?? 1)
      : null,
    next_occurs_on:
      input.isRecurring && input.nextOccursOn ? input.nextOccursOn : null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function importTransactionsFromCsv(
  userId: string,
  input: CsvImportInput,
) {
  const rows = parseCsv(input.csv);
  if (!rows.length) {
    return;
  }

  const supabase = await createClient();
  const importBatchId = crypto.randomUUID();

  const { error } = await supabase.from("finance_transactions").insert(
    rows.map((row) => ({
      user_id: userId,
      occurred_on: row.occurredOn,
      amount: Number.isFinite(row.amount) ? row.amount : 0,
      transaction_type:
        row.transactionType === "income" ||
        row.transactionType === "expense" ||
        row.transactionType === "transfer"
          ? row.transactionType
          : "expense",
      category: row.category || "Imported",
      merchant: row.merchant || null,
      account_name: row.accountName || null,
      notes: row.notes || null,
      external_source: "csv",
      import_batch_id: importBatchId,
    })),
  );

  if (error) {
    throw new Error(error.message);
  }
}
