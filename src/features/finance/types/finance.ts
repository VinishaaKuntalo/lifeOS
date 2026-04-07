export type FinanceTransactionType = "income" | "expense" | "transfer";
export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export type Budget = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  amount: number;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
};

export type FinanceTransaction = {
  id: string;
  user_id: string;
  budget_id: string | null;
  occurred_on: string;
  amount: number;
  transaction_type: FinanceTransactionType;
  category: string;
  merchant: string | null;
  account_name: string | null;
  notes: string | null;
  is_recurring: boolean;
  recurrence_frequency: RecurrenceFrequency | null;
  recurrence_interval: number | null;
  next_occurs_on: string | null;
  external_source: string | null;
  import_batch_id: string | null;
  created_at: string;
  updated_at: string;
};

export type FinanceWorkspaceData = {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netCashflow: number;
    totalBudgeted: number;
    budgetUtilizationPercent: number;
  };
  budgets: Budget[];
  transactions: FinanceTransaction[];
};

export type FinanceMutationResponse = {
  data: FinanceWorkspaceData;
  message: string;
};
