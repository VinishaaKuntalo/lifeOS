"use client";

import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, FolderPlus, GripVertical, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";

import {
  projectFormSchema,
  taskFormSchema,
  type ProjectFormInput,
  type TaskFormInput,
} from "@/features/tasks/schemas/task-schemas";
import type {
  TaskBucket,
  TasksWorkspaceData,
  TaskView,
} from "@/features/tasks/types/task";
import {
  useArchiveTaskMutation,
  useCreateProjectMutation,
  useCreateTaskMutation,
  useMoveTaskMutation,
  useTasksWorkspace,
  useUpdateTaskMutation,
} from "@/features/tasks/hooks/use-tasks-query";

const taskDefaultValues: TaskFormInput = {
  title: "",
  description: "",
  bucket: "inbox",
  priority: "medium",
  dueAt: "",
  projectId: "",
  parentTaskId: "",
  effortMinutes: undefined,
};

const projectDefaultValues: ProjectFormInput = {
  name: "",
  description: "",
  color: "#2563eb",
};

const buckets: Array<{ key: TaskBucket; label: string }> = [
  { key: "inbox", label: "Inbox" },
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "someday", label: "Someday" },
];

type TasksDashboardProps = {
  initialData: TasksWorkspaceData;
};

export function TasksDashboard({ initialData }: TasksDashboardProps) {
  const { data, isError, refetch } = useTasksWorkspace(initialData);
  const createTaskMutation = useCreateTaskMutation();
  const updateTaskMutation = useUpdateTaskMutation();
  const moveTaskMutation = useMoveTaskMutation();
  const archiveTaskMutation = useArchiveTaskMutation();
  const createProjectMutation = useCreateProjectMutation();
  const [editingTask, setEditingTask] = useState<TaskView | null>(null);
  const [projectComposerOpen, setProjectComposerOpen] = useState(false);

  const taskForm = useForm<TaskFormInput>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: taskDefaultValues,
  });

  const projectForm = useForm<ProjectFormInput>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: projectDefaultValues,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (!isTyping && event.key.toLowerCase() === "t") {
        event.preventDefault();
        document.getElementById("task-title")?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const allRootTasks = useMemo(
    () => buckets.flatMap((bucket) => data?.buckets[bucket.key] ?? []),
    [data],
  );

  const resetTaskComposer = () => {
    setEditingTask(null);
    taskForm.reset(taskDefaultValues);
  };

  const startEditTask = (entry: TaskView) => {
    setEditingTask(entry);
    taskForm.reset({
      title: entry.task.title,
      description: entry.task.description ?? "",
      bucket: entry.task.bucket,
      priority: entry.task.priority,
      dueAt: entry.task.due_at?.slice(0, 10) ?? "",
      projectId: entry.task.project_id ?? "",
      parentTaskId: entry.task.parent_task_id ?? "",
      effortMinutes: entry.task.effort_minutes ?? undefined,
    });
  };

  const onSubmitTask = taskForm.handleSubmit(async (values) => {
    if (editingTask) {
      await updateTaskMutation.mutateAsync({
        taskId: editingTask.task.id,
        input: values,
      });
    } else {
      await createTaskMutation.mutateAsync(values);
    }

    resetTaskComposer();
  });

  const onSubmitProject = projectForm.handleSubmit(async (values) => {
    await createProjectMutation.mutateAsync(values);
    projectForm.reset(projectDefaultValues);
    setProjectComposerOpen(false);
  });

  const onDragEnd = (event: DragEndEvent) => {
    const taskId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;

    if (!data || !overId) {
      return;
    }

    const destinationBucket = buckets.find((bucket) => bucket.key === overId)
      ? (overId as TaskBucket)
      : (allRootTasks.find((entry) => entry.task.id === overId)?.task.bucket ??
        "inbox");

    const destinationTasks = data.buckets[destinationBucket];
    const targetIndex = Math.max(
      0,
      destinationTasks.findIndex((entry) => entry.task.id === overId),
    );

    void moveTaskMutation.mutateAsync({
      taskId,
      input: {
        bucket: destinationBucket,
        sortOrder:
          targetIndex >= 0 && destinationTasks.length
            ? targetIndex
            : destinationTasks.length,
      },
    });
  };

  if (isError || !data) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle>Unable to load tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load your GTD workspace right now.
          </p>
          <Button onClick={() => void refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Inbox" value={data.summary.inboxCount} />
        <SummaryCard label="Due now" value={data.summary.dueTodayCount} />
        <SummaryCard label="Upcoming" value={data.summary.upcomingCount} />
        <SummaryCard label="Completed" value={data.summary.completedCount} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Card className="border-border/70 bg-card/70">
            <CardHeader>
              <CardTitle>
                {editingTask ? "Edit task" : "Quick capture"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmitTask}>
                <div className="space-y-2">
                  <Label htmlFor="task-title">Title</Label>
                  <Input id="task-title" {...taskForm.register("title")} />
                  <FieldError
                    message={taskForm.formState.errors.title?.message}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-description">Description</Label>
                  <Textarea
                    id="task-description"
                    {...taskForm.register("description")}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <SelectField
                    id="task-bucket"
                    label="Bucket"
                    field={taskForm.register("bucket")}
                    options={buckets.map((bucket) => ({
                      value: bucket.key,
                      label: bucket.label,
                    }))}
                  />
                  <SelectField
                    id="task-priority"
                    label="Priority"
                    field={taskForm.register("priority")}
                    options={[
                      { value: "low", label: "Low" },
                      { value: "medium", label: "Medium" },
                      { value: "high", label: "High" },
                      { value: "urgent", label: "Urgent" },
                    ]}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="task-dueAt">Due date</Label>
                    <Input
                      id="task-dueAt"
                      type="date"
                      {...taskForm.register("dueAt")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-effortMinutes">Effort (minutes)</Label>
                    <Input
                      id="task-effortMinutes"
                      type="number"
                      min={0}
                      max={1440}
                      {...taskForm.register("effortMinutes")}
                    />
                  </div>
                </div>

                <SelectField
                  id="task-projectId"
                  label="Project"
                  field={taskForm.register("projectId")}
                  options={[
                    { value: "", label: "Inbox project" },
                    ...data.projects.map((project) => ({
                      value: project.id,
                      label: project.name,
                    })),
                  ]}
                />

                <SelectField
                  id="task-parentTaskId"
                  label="Parent task"
                  field={taskForm.register("parentTaskId")}
                  options={[
                    { value: "", label: "No parent" },
                    ...allRootTasks
                      .filter((entry) => entry.task.id !== editingTask?.task.id)
                      .map((entry) => ({
                        value: entry.task.id,
                        label: entry.task.title,
                      })),
                  ]}
                />

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={
                      createTaskMutation.isPending ||
                      updateTaskMutation.isPending
                    }
                  >
                    {editingTask ? "Save task" : "Add task"}
                  </Button>
                  {editingTask && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetTaskComposer}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/70">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Projects</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setProjectComposerOpen((open) => !open)}
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {projectComposerOpen && (
                <form className="space-y-3" onSubmit={onSubmitProject}>
                  <Input
                    placeholder="Project name"
                    {...projectForm.register("name")}
                  />
                  <Textarea
                    placeholder="Project description"
                    {...projectForm.register("description")}
                  />
                  <Input type="color" {...projectForm.register("color")} />
                  <Button
                    type="submit"
                    disabled={createProjectMutation.isPending}
                  >
                    Create project
                  </Button>
                </form>
              )}

              <div className="space-y-2">
                {data.projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/25 px-3 py-2"
                  >
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: project.color ?? "#475569" }}
                    />
                    <div>
                      <p className="text-sm font-medium">{project.name}</p>
                      {project.description && (
                        <p className="text-xs text-muted-foreground">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={onDragEnd}
        >
          <div className="grid gap-4 xl:grid-cols-4">
            {buckets.map((bucket) => (
              <TaskColumn
                key={bucket.key}
                bucket={bucket.key}
                label={bucket.label}
                entries={data.buckets[bucket.key]}
                busy={
                  moveTaskMutation.isPending || archiveTaskMutation.isPending
                }
                onEdit={startEditTask}
                onArchive={(taskId) => archiveTaskMutation.mutate(taskId)}
              />
            ))}
          </div>
        </DndContext>
      </div>
    </section>
  );
}

function TaskColumn({
  bucket,
  label,
  entries,
  busy,
  onEdit,
  onArchive,
}: {
  bucket: TaskBucket;
  label: string;
  entries: TaskView[];
  busy: boolean;
  onEdit: (entry: TaskView) => void;
  onArchive: (taskId: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: bucket });

  return (
    <Card ref={setNodeRef} className="border-border/70 bg-card/70">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <span>{label}</span>
          <span className="text-sm text-muted-foreground">
            {entries.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SortableContext
          items={entries.map((entry) => entry.task.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {entries.map((entry) => (
              <TaskCard
                key={entry.task.id}
                entry={entry}
                busy={busy}
                onEdit={() => onEdit(entry)}
                onArchive={() => onArchive(entry.task.id)}
              />
            ))}
            {!entries.length && (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
                Drop tasks here.
              </div>
            )}
          </div>
        </SortableContext>
      </CardContent>
    </Card>
  );
}

function TaskCard({
  entry,
  busy,
  onEdit,
  onArchive,
}: {
  entry: TaskView;
  busy: boolean;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: entry.task.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className="rounded-xl border border-border/70 bg-secondary/20 p-4"
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-1 text-muted-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{entry.task.title}</p>
              <span
                className={cn(
                  "rounded-full px-2 py-1 text-xs font-medium uppercase tracking-[0.15em]",
                  entry.task.priority === "urgent" &&
                    "bg-red-500/15 text-red-200",
                  entry.task.priority === "high" &&
                    "bg-orange-500/15 text-orange-200",
                  entry.task.priority === "medium" &&
                    "bg-sky-500/15 text-sky-200",
                  entry.task.priority === "low" &&
                    "bg-slate-500/20 text-slate-200",
                )}
              >
                {entry.task.priority}
              </span>
            </div>
            {entry.task.description && (
              <p className="text-sm text-muted-foreground">
                {entry.task.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {entry.project && (
              <span className="rounded-full border border-border/60 px-2 py-1">
                {entry.project.name}
              </span>
            )}
            {entry.task.due_at && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-1">
                <Calendar className="h-3 w-3" />
                {entry.task.due_at.slice(0, 10)}
              </span>
            )}
            {entry.subtasks.length > 0 && (
              <span className="rounded-full border border-border/60 px-2 py-1">
                {entry.subtasks.length} subtasks
              </span>
            )}
          </div>

          {entry.subtasks.length > 0 && (
            <div className="space-y-2 rounded-xl border border-border/60 bg-background/40 p-3">
              {entry.subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span>{subtask.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {subtask.priority}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              disabled={busy}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onArchive}
              disabled={busy}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Archive
            </Button>
          </div>
        </div>
      </div>
    </div>
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

function SelectField({
  id,
  label,
  options,
  field,
}: {
  id: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  field: UseFormRegisterReturn;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
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
