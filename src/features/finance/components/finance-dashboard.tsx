"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  budgetSchema,
  csvImportSchema,
  financeTransactionSchema,
  type BudgetInput,
  type CsvImportInput,
  type FinanceTransactionInput,
} from "@/features/finance/schemas/finance-schemas";
import type { FinanceWorkspaceData } from "@/features/finance/types/finance";
import {
  useCreateBudgetMutation,
  useCreateTransactionMutation,
  useFinanceWorkspace,
  useImportCsvMutation,
} from "@/features/finance/hooks/use-finance-query";

type FinanceDashboardProps = {
  initialData: FinanceWorkspaceData;
};

export function FinanceDashboard({ initialData }: FinanceDashboardProps) {
  const { data, isError, refetch } = useFinanceWorkspace(initialData);
  const budgetMutation = useCreateBudgetMutation();
  const transactionMutation = useCreateTransactionMutation();
  const importMutation = useImportCsvMutation();

  const budgetForm = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: "",
      category: "",
      amount: 0,
      periodStart: new Date().toISOString().slice(0, 10),
      periodEnd: new Date().toISOString().slice(0, 10),
    },
  });

  const transactionForm = useForm<FinanceTransactionInput>({
    resolver: zodResolver(financeTransactionSchema),
    defaultValues: {
      occurredOn: new Date().toISOString().slice(0, 10),
      amount: 0,
      transactionType: "expense",
      category: "",
      merchant: "",
      accountName: "",
      notes: "",
      budgetId: "",
      isRecurring: false,
      recurrenceFrequency: "monthly",
      recurrenceInterval: 1,
      nextOccursOn: "",
    },
  });

  const importForm = useForm<CsvImportInput>({
    resolver: zodResolver(csvImportSchema),
    defaultValues: {
      csv: "occurredOn,amount,transactionType,category,merchant,accountName,notes",
    },
  });

  if (isError || !data) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle>Unable to load finance workspace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load finance data right now.
          </p>
          <Button onClick={() => void refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Income"
          value={data.summary.totalIncome.toFixed(2)}
        />
        <SummaryCard
          label="Expense"
          value={data.summary.totalExpense.toFixed(2)}
        />
        <SummaryCard
          label="Net cashflow"
          value={data.summary.netCashflow.toFixed(2)}
        />
        <SummaryCard
          label="Budgeted"
          value={data.summary.totalBudgeted.toFixed(2)}
        />
        <SummaryCard
          label="Budget used"
          value={`${data.summary.budgetUtilizationPercent}%`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Card className="border-border/70 bg-card/70">
            <CardHeader>
              <CardTitle>Create budget</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={budgetForm.handleSubmit(async (values) => {
                  await budgetMutation.mutateAsync(values);
                })}
              >
                <Input
                  placeholder="Budget name"
                  {...budgetForm.register("name")}
                />
                <Input
                  placeholder="Category"
                  {...budgetForm.register("category")}
                />
                <Input
                  type="number"
                  step="0.01"
                  {...budgetForm.register("amount")}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input type="date" {...budgetForm.register("periodStart")} />
                  <Input type="date" {...budgetForm.register("periodEnd")} />
                </div>
                <Button type="submit" disabled={budgetMutation.isPending}>
                  Save budget
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/70">
            <CardHeader>
              <CardTitle>CSV import</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={importForm.handleSubmit(async (values) => {
                  await importMutation.mutateAsync(values);
                })}
              >
                <Textarea rows={8} {...importForm.register("csv")} />
                <Button type="submit" disabled={importMutation.isPending}>
                  Import CSV
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/70 bg-card/70">
            <CardHeader>
              <CardTitle>Add transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={transactionForm.handleSubmit(async (values) => {
                  await transactionMutation.mutateAsync(values);
                })}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    type="date"
                    {...transactionForm.register("occurredOn")}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    {...transactionForm.register("amount")}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <select
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    {...transactionForm.register("transactionType")}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="transfer">Transfer</option>
                  </select>
                  <Input
                    placeholder="Category"
                    {...transactionForm.register("category")}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    placeholder="Merchant"
                    {...transactionForm.register("merchant")}
                  />
                  <Input
                    placeholder="Account"
                    {...transactionForm.register("accountName")}
                  />
                </div>
                <Input
                  placeholder="Notes"
                  {...transactionForm.register("notes")}
                />
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...transactionForm.register("isRecurring")}
                  />
                  Recurring transaction
                </Label>
                <Button type="submit" disabled={transactionMutation.isPending}>
                  Save transaction
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/70">
            <CardHeader>
              <CardTitle>Recent transactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.transactions.slice(0, 20).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/20 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{transaction.category}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.occurred_on}{" "}
                      {transaction.merchant ? `• ${transaction.merchant}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {transaction.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.transaction_type}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Card className="border-border/70 bg-card/70">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}
