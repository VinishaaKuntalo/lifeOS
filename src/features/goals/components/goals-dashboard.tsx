"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Flag, Plus, Target, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";

import {
  goalFormSchema,
  milestoneFormSchema,
  type GoalFormInput,
  type MilestoneFormInput,
} from "@/features/goals/schemas/goal-schemas";
import type { GoalsWorkspaceData, GoalView } from "@/features/goals/types/goal";
import {
  useArchiveGoalMutation,
  useCreateGoalMutation,
  useCreateMilestoneMutation,
  useGoalsWorkspace,
  useUpdateGoalMutation,
} from "@/features/goals/hooks/use-goals-query";

const goalDefaults: GoalFormInput = {
  title: "",
  description: "",
  status: "active",
  startDate: "",
  targetDate: "",
  outcomeMetric: "",
  targetValue: undefined,
  currentValue: 0,
  habitIds: [],
  taskIds: [],
};

type GoalsDashboardProps = {
  initialData: GoalsWorkspaceData;
};

export function GoalsDashboard({ initialData }: GoalsDashboardProps) {
  const { data, isError, refetch } = useGoalsWorkspace(initialData);
  const createGoalMutation = useCreateGoalMutation();
  const updateGoalMutation = useUpdateGoalMutation();
  const archiveGoalMutation = useArchiveGoalMutation();
  const createMilestoneMutation = useCreateMilestoneMutation();
  const [editingGoal, setEditingGoal] = useState<GoalView | null>(null);

  const goalForm = useForm<GoalFormInput>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: goalDefaults,
  });

  const activeGoals = useMemo(
    () =>
      [...(data?.goals ?? [])].sort(
        (a, b) => b.progressPercent - a.progressPercent,
      ),
    [data?.goals],
  );

  const resetGoalComposer = () => {
    setEditingGoal(null);
    goalForm.reset(goalDefaults);
  };

  const startEdit = (goalView: GoalView) => {
    setEditingGoal(goalView);
    goalForm.reset({
      title: goalView.goal.title,
      description: goalView.goal.description ?? "",
      status: goalView.goal.status,
      startDate: goalView.goal.start_date ?? "",
      targetDate: goalView.goal.target_date ?? "",
      outcomeMetric: goalView.goal.outcome_metric ?? "",
      targetValue: goalView.goal.target_value ?? undefined,
      currentValue: goalView.goal.current_value,
      habitIds: goalView.linkedHabits.map((item) => item.id),
      taskIds: goalView.linkedTasks.map((item) => item.id),
    });
  };

  const onSubmitGoal = goalForm.handleSubmit(async (values) => {
    if (editingGoal) {
      await updateGoalMutation.mutateAsync({
        goalId: editingGoal.goal.id,
        input: values,
      });
    } else {
      await createGoalMutation.mutateAsync(values);
    }

    resetGoalComposer();
  });

  if (isError || !data) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle>Unable to load goals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load your goals right now.
          </p>
          <Button onClick={() => void refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Active goals" value={data.summary.activeGoals} />
        <SummaryCard
          label="Completed goals"
          value={data.summary.completedGoals}
        />
        <SummaryCard label="Milestones" value={data.summary.totalMilestones} />
        <SummaryCard
          label="Linked execution"
          value={data.summary.linkedExecutionItems}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle>
              {editingGoal ? "Edit goal" : "Create SMART goal"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmitGoal}>
              <div className="space-y-2">
                <Label htmlFor="goal-title">Title</Label>
                <Input id="goal-title" {...goalForm.register("title")} />
                <FieldError
                  message={goalForm.formState.errors.title?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal-description">Description</Label>
                <Textarea
                  id="goal-description"
                  {...goalForm.register("description")}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Status"
                  field={goalForm.register("status")}
                  options={[
                    { value: "draft", label: "Draft" },
                    { value: "active", label: "Active" },
                    { value: "at_risk", label: "At risk" },
                    { value: "completed", label: "Completed" },
                    { value: "archived", label: "Archived" },
                  ]}
                />
                <div className="space-y-2">
                  <Label htmlFor="goal-metric">Outcome metric</Label>
                  <Input
                    id="goal-metric"
                    {...goalForm.register("outcomeMetric")}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="goal-startDate">Start date</Label>
                  <Input
                    id="goal-startDate"
                    type="date"
                    {...goalForm.register("startDate")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-targetDate">Target date</Label>
                  <Input
                    id="goal-targetDate"
                    type="date"
                    {...goalForm.register("targetDate")}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="goal-targetValue">Target value</Label>
                  <Input
                    id="goal-targetValue"
                    type="number"
                    min={0}
                    step="0.1"
                    {...goalForm.register("targetValue")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-currentValue">Current value</Label>
                  <Input
                    id="goal-currentValue"
                    type="number"
                    min={0}
                    step="0.1"
                    {...goalForm.register("currentValue")}
                  />
                </div>
              </div>

              <LinkSelector
                label="Linked habits"
                items={data.availableHabits.map((habit) => ({
                  id: habit.id,
                  label: habit.name,
                }))}
                values={goalForm.watch("habitIds")}
                toggle={(value) => {
                  const current = goalForm.getValues("habitIds");
                  goalForm.setValue(
                    "habitIds",
                    current.includes(value)
                      ? current.filter((item) => item !== value)
                      : [...current, value],
                  );
                }}
              />

              <LinkSelector
                label="Linked tasks"
                items={data.availableTasks.map((task) => ({
                  id: task.id,
                  label: task.title,
                }))}
                values={goalForm.watch("taskIds")}
                toggle={(value) => {
                  const current = goalForm.getValues("taskIds");
                  goalForm.setValue(
                    "taskIds",
                    current.includes(value)
                      ? current.filter((item) => item !== value)
                      : [...current, value],
                  );
                }}
              />

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={
                    createGoalMutation.isPending || updateGoalMutation.isPending
                  }
                >
                  {editingGoal ? "Save goal" : "Create goal"}
                </Button>
                {editingGoal && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetGoalComposer}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {activeGoals.map((goalView) => (
            <Card
              key={goalView.goal.id}
              className="border-border/70 bg-card/70"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">
                      {goalView.goal.title}
                    </CardTitle>
                  </div>
                  {goalView.goal.description && (
                    <p className="text-sm text-muted-foreground">
                      {goalView.goal.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(goalView)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => archiveGoalMutation.mutate(goalView.goal.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Archive
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span>{goalView.progressPercent}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-secondary">
                        <div
                          className="h-3 rounded-full bg-primary transition-all"
                          style={{ width: `${goalView.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <MetricPill
                        label="Status"
                        value={goalView.goal.status.replace("_", " ")}
                      />
                      <MetricPill
                        label="Milestones"
                        value={`${goalView.completedMilestones}/${goalView.totalMilestones}`}
                      />
                      <MetricPill
                        label="Metric"
                        value={
                          goalView.goal.outcome_metric
                            ? `${goalView.goal.current_value}/${goalView.goal.target_value ?? "-"}`
                            : "Not set"
                        }
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl border border-border/70 bg-secondary/20 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          Linked habits
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {goalView.linkedHabits.length ? (
                            goalView.linkedHabits.map((habit) => (
                              <span
                                key={habit.id}
                                className="rounded-full border border-border/70 px-3 py-1 text-sm"
                              >
                                {habit.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              No habits linked yet.
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-border/70 bg-secondary/20 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          Linked tasks
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {goalView.linkedTasks.length ? (
                            goalView.linkedTasks.map((task) => (
                              <span
                                key={task.id}
                                className="rounded-full border border-border/70 px-3 py-1 text-sm"
                              >
                                {task.title}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              No tasks linked yet.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <MilestoneComposer
                    goalId={goalView.goal.id}
                    busy={createMilestoneMutation.isPending}
                    onSubmit={async (input) => {
                      await createMilestoneMutation.mutateAsync(input);
                    }}
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">Milestones</p>
                  {goalView.milestones.length ? (
                    <div className="space-y-3">
                      {goalView.milestones.map((milestone) => (
                        <div
                          key={milestone.id}
                          className="rounded-xl border border-border/70 bg-secondary/20 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{milestone.title}</p>
                              {milestone.description && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {milestone.description}
                                </p>
                              )}
                            </div>
                            {milestone.completed_at ? (
                              <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.15em] text-primary">
                                Complete
                              </span>
                            ) : (
                              <Flag className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {milestone.target_value !== null && (
                              <span className="rounded-full border border-border/70 px-2 py-1">
                                {milestone.current_value}/
                                {milestone.target_value}
                              </span>
                            )}
                            {milestone.due_at && (
                              <span className="rounded-full border border-border/70 px-2 py-1">
                                Due {milestone.due_at.slice(0, 10)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
                      No milestones yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
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

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-secondary/20 p-3">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium capitalize">{value}</p>
    </div>
  );
}

function LinkSelector({
  label,
  items,
  values,
  toggle,
}: {
  label: string;
  items: Array<{ id: string; label: string }>;
  values: string[];
  toggle: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="max-h-32 space-y-2 overflow-y-auto rounded-xl border border-border/70 bg-secondary/20 p-3">
        {items.length ? (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              className={cn(
                "w-full rounded-lg border px-3 py-2 text-left text-sm transition",
                values.includes(item.id)
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border/60 bg-background/40 text-muted-foreground",
              )}
            >
              {item.label}
            </button>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No items available yet.
          </p>
        )}
      </div>
    </div>
  );
}

function SelectField({
  label,
  field,
  options,
}: {
  label: string;
  field: UseFormRegisterReturn;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select
        className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        {...field}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}

function MilestoneComposer({
  goalId,
  busy,
  onSubmit,
}: {
  goalId: string;
  busy: boolean;
  onSubmit: (input: MilestoneFormInput) => Promise<void>;
}) {
  const form = useForm<MilestoneFormInput>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues: {
      goalId,
      title: "",
      description: "",
      targetValue: undefined,
      currentValue: 0,
      dueAt: "",
    },
  });

  return (
    <Card className="border-border/60 bg-background/40">
      <CardHeader>
        <CardTitle className="text-base">Add milestone</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit({ ...values, goalId });
            form.reset({
              goalId,
              title: "",
              description: "",
              targetValue: undefined,
              currentValue: 0,
              dueAt: "",
            });
          })}
        >
          <Input placeholder="Milestone title" {...form.register("title")} />
          <Textarea
            placeholder="Milestone description"
            {...form.register("description")}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              type="number"
              min={0}
              step="0.1"
              placeholder="Target"
              {...form.register("targetValue")}
            />
            <Input
              type="number"
              min={0}
              step="0.1"
              placeholder="Current"
              {...form.register("currentValue")}
            />
          </div>
          <Input type="date" {...form.register("dueAt")} />
          <Button type="submit" className="w-full" disabled={busy}>
            <Plus className="mr-2 h-4 w-4" />
            Add milestone
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
