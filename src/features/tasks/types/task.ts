export type TaskBucket = "inbox" | "today" | "upcoming" | "someday";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "completed" | "cancelled";
export type ProjectStatus = "active" | "on_hold" | "completed" | "archived";

export type Project = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string | null;
  status: ProjectStatus;
  is_inbox: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  user_id: string;
  project_id: string | null;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  bucket: TaskBucket;
  priority: TaskPriority;
  due_at: string | null;
  start_at: string | null;
  completed_at: string | null;
  sort_order: number;
  effort_minutes: number | null;
  created_at: string;
  updated_at: string;
};

export type TaskView = {
  task: Task;
  project: Project | null;
  subtasks: Task[];
};

export type TasksWorkspaceData = {
  summary: {
    inboxCount: number;
    dueTodayCount: number;
    upcomingCount: number;
    completedCount: number;
  };
  projects: Project[];
  buckets: Record<TaskBucket, TaskView[]>;
};

export type TaskMutationResponse = {
  data: TasksWorkspaceData;
  message: string;
};
