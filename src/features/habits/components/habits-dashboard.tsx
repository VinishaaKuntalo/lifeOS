"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Flame, SquarePen, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";

import {
  habitFormSchema,
  type HabitFormInput,
} from "@/features/habits/schemas/habit-schemas";
import type {
  HabitsDashboardData,
  HabitView,
} from "@/features/habits/types/habit";
import {
  useArchiveHabitMutation,
  useCreateHabitMutation,
  useHabitsDashboard,
  useToggleHabitLogMutation,
  useUpdateHabitMutation,
} from "@/features/habits/hooks/use-habits-query";

type HabitsDashboardProps = {
  initialData: HabitsDashboardData;
};

const defaultValues: HabitFormInput = {
  name: "",
  description: "",
  frequencyUnit: "daily",
  frequencyInterval: 1,
  targetCount: 1,
  color: "#0f766e",
};

export function HabitsDashboard({ initialData }: HabitsDashboardProps) {
  const { data, isLoading, isError, refetch } = useHabitsDashboard(initialData);
  const createMutation = useCreateHabitMutation();
  const updateMutation = useUpdateHabitMutation();
  const archiveMutation = useArchiveHabitMutation();
  const toggleMutation = useToggleHabitLogMutation();
  const [editingHabit, setEditingHabit] = useState<HabitView | null>(null);

  const form = useForm<HabitFormInput>({
    resolver: zodResolver(habitFormSchema),
    defaultValues,
  });

  const orderedHabits = useMemo(
    () =>
      [...(data?.habits ?? [])].sort(
        (a, b) => b.streaks.current - a.streaks.current,
      ),
    [data?.habits],
  );

  const resetToCreate = () => {
    setEditingHabit(null);
    form.reset(defaultValues);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (editingHabit) {
      await updateMutation.mutateAsync({
        habitId: editingHabit.habit.id,
        input: values,
      });
    } else {
      await createMutation.mutateAsync(values);
    }

    resetToCreate();
  });

  const startEdit = (habit: HabitView) => {
    setEditingHabit(habit);
    form.reset({
      name: habit.habit.name,
      description: habit.habit.description ?? "",
      frequencyUnit: habit.habit.frequency_unit,
      frequencyInterval: habit.habit.frequency_interval,
      targetCount: habit.habit.target_count,
      color: habit.habit.color ?? "#0f766e",
    });
  };

  if (isError || !data) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle>Unable to load habits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load your habits right now. Try the request again.
          </p>
          <Button onClick={() => void refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Active habits" value={data.summary.totalHabits} />
        <SummaryCard
          label="Completed today"
          value={data.summary.completedToday}
        />
        <SummaryCard
          label="Longest live streak"
          value={data.summary.longestCurrentStreak}
        />
        <SummaryCard
          label="Consistency score"
          value={`${data.summary.consistencyScore}%`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle>
              {editingHabit ? "Edit habit" : "Create a new habit"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...form.register("name")} />
                <FieldError message={form.formState.errors.name?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...form.register("description")} />
                <FieldError
                  message={form.formState.errors.description?.message}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="frequencyUnit">Frequency</Label>
                  <select
                    id="frequencyUnit"
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    {...form.register("frequencyUnit")}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequencyInterval">Every</Label>
                  <Input
                    id="frequencyInterval"
                    type="number"
                    min={1}
                    max={30}
                    {...form.register("frequencyInterval")}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="targetCount">Target count</Label>
                  <Input
                    id="targetCount"
                    type="number"
                    min={1}
                    max={30}
                    {...form.register("targetCount")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Accent color</Label>
                  <Input id="color" type="color" {...form.register("color")} />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending ||
                    updateMutation.isPending ||
                    isLoading
                  }
                >
                  {editingHabit ? "Save changes" : "Add habit"}
                </Button>
                {editingHabit && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetToCreate}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/70 bg-card/70">
            <CardHeader>
              <CardTitle>90-day activity heatmap</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="sm:grid-cols-15 grid grid-cols-10 gap-2">
                {data.heatmap.map((cell) => (
                  <div
                    key={cell.date}
                    title={`${cell.date}: ${cell.count} completions`}
                    className={cn(
                      "aspect-square rounded-md border border-border/60",
                      cell.count === 0 && "bg-secondary/40",
                      cell.count === 1 && "bg-primary/35",
                      cell.count === 2 && "bg-primary/55",
                      cell.count >= 3 && "bg-primary",
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Darker cells mean more habit completions across the last 90
                days. Dates are aligned to {data.timeZone}.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {orderedHabits.map((entry) => (
              <HabitCard
                key={entry.habit.id}
                entry={entry}
                today={data.today}
                onEdit={() => startEdit(entry)}
                onArchive={() =>
                  archiveMutation.mutate(entry.habit.id, {
                    onSuccess: () => {
                      if (editingHabit?.habit.id === entry.habit.id) {
                        resetToCreate();
                      }
                    },
                  })
                }
                onToggle={() =>
                  toggleMutation.mutate({
                    habitId: entry.habit.id,
                    input: {
                      logDate: data.today,
                      completedCount: entry.habit.target_count,
                    },
                  })
                }
                busy={
                  toggleMutation.isPending ||
                  archiveMutation.isPending ||
                  updateMutation.isPending
                }
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HabitCard({
  entry,
  today,
  onEdit,
  onArchive,
  onToggle,
  busy,
}: {
  entry: HabitView;
  today: string;
  onEdit: () => void;
  onArchive: () => void;
  onToggle: () => void;
  busy: boolean;
}) {
  return (
    <Card className="border-border/70 bg-card/70">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: entry.habit.color ?? "#0f766e" }}
              />
              <CardTitle className="text-lg">{entry.habit.name}</CardTitle>
            </div>
            {entry.habit.description && (
              <p className="text-sm text-muted-foreground">
                {entry.habit.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={onEdit}>
              <SquarePen className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onArchive}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <MetricPill
            label="Frequency"
            value={`${entry.habit.frequency_unit} x${entry.habit.frequency_interval}`}
          />
          <MetricPill
            label="Target"
            value={`${entry.progress.completedToday}/${entry.progress.target}`}
          />
          <MetricPill
            label="Streak"
            value={`${entry.streaks.current} days`}
            icon={<Flame className="h-3.5 w-3.5 text-orange-400" />}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/30 px-4 py-3">
          <div>
            <p className="text-sm font-medium">
              {entry.progress.isCompleteToday
                ? "Completed for today"
                : "Not completed yet"}
            </p>
            <p className="text-xs text-muted-foreground">
              Tracking date {today} in your profile timezone.
            </p>
          </div>
          <Button
            onClick={onToggle}
            disabled={busy}
            variant={entry.progress.isCompleteToday ? "outline" : "default"}
          >
            {entry.progress.isCompleteToday ? "Undo" : "Mark done"}
          </Button>
        </div>
      </CardContent>
    </Card>
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

function MetricPill({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-secondary/30 p-3">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-1.5 text-sm font-medium">
        {icon}
        <span>{value}</span>
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}
