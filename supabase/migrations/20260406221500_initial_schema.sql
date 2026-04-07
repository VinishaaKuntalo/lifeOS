create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    user_id,
    email,
    full_name,
    avatar_url
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create type public.habit_frequency_unit as enum ('daily', 'weekly');
create type public.habit_log_status as enum ('completed', 'skipped', 'partial');
create type public.project_status as enum ('active', 'on_hold', 'completed', 'archived');
create type public.task_status as enum ('todo', 'in_progress', 'completed', 'cancelled');
create type public.task_bucket as enum ('inbox', 'today', 'upcoming', 'someday');
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.goal_status as enum ('draft', 'active', 'at_risk', 'completed', 'archived');
create type public.journal_mood as enum ('great', 'good', 'neutral', 'low', 'bad');
create type public.health_metric_type as enum ('weight', 'sleep', 'water', 'steps', 'mood');
create type public.finance_transaction_type as enum ('income', 'expense', 'transfer');
create type public.recurrence_frequency as enum ('daily', 'weekly', 'monthly', 'yearly');

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  timezone text not null default 'UTC',
  locale text not null default 'en-CA',
  currency_code text not null default 'CAD',
  theme_preference text not null default 'dark',
  notifications_enabled boolean not null default false,
  height_cm numeric(6, 2),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  frequency_unit public.habit_frequency_unit not null,
  frequency_interval integer not null default 1 check (frequency_interval > 0),
  target_count integer not null default 1 check (target_count > 0),
  color text,
  icon text,
  starts_on date not null default current_date,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id uuid not null,
  log_date date not null,
  completed_count integer not null default 1 check (completed_count >= 0),
  status public.habit_log_status not null default 'completed',
  notes text,
  logged_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  color text,
  status public.project_status not null default 'active',
  is_inbox boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid,
  parent_task_id uuid,
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  bucket public.task_bucket not null default 'inbox',
  priority public.task_priority not null default 'medium',
  due_at timestamptz,
  start_at timestamptz,
  completed_at timestamptz,
  sort_order integer not null default 0,
  effort_minutes integer check (effort_minutes is null or effort_minutes >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  status public.goal_status not null default 'draft',
  target_date date,
  start_date date,
  outcome_metric text,
  target_value numeric(12, 2),
  current_value numeric(12, 2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null,
  title text not null,
  description text,
  target_value numeric(12, 2),
  current_value numeric(12, 2) not null default 0,
  due_at timestamptz,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.goal_habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null,
  habit_id uuid not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.goal_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null,
  task_id uuid not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  title text,
  content_json jsonb not null default '{}'::jsonb,
  content_text text not null default '',
  mood public.journal_mood,
  word_count integer not null default 0 check (word_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.health_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  metric_type public.health_metric_type not null,
  metric_date date not null,
  value_numeric numeric(12, 2) not null,
  unit text,
  notes text,
  recorded_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  check (period_end >= period_start)
);

create table public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  budget_id uuid,
  occurred_on date not null,
  amount numeric(12, 2) not null check (amount >= 0),
  transaction_type public.finance_transaction_type not null,
  category text not null,
  merchant text,
  account_name text,
  notes text,
  is_recurring boolean not null default false,
  recurrence_frequency public.recurrence_frequency,
  recurrence_interval integer check (recurrence_interval is null or recurrence_interval > 0),
  next_occurs_on date,
  external_source text,
  import_batch_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

alter table public.habits add constraint habits_id_user_id_unique unique (id, user_id);
alter table public.projects add constraint projects_id_user_id_unique unique (id, user_id);
alter table public.tasks add constraint tasks_id_user_id_unique unique (id, user_id);
alter table public.goals add constraint goals_id_user_id_unique unique (id, user_id);
alter table public.budgets add constraint budgets_id_user_id_unique unique (id, user_id);

alter table public.habit_logs
  add constraint habit_logs_habit_fk
  foreign key (habit_id, user_id)
  references public.habits (id, user_id)
  on delete cascade;

alter table public.tasks
  add constraint tasks_project_fk
  foreign key (project_id, user_id)
  references public.projects (id, user_id)
  on delete restrict;

alter table public.tasks
  add constraint tasks_parent_task_fk
  foreign key (parent_task_id, user_id)
  references public.tasks (id, user_id)
  on delete cascade;

alter table public.milestones
  add constraint milestones_goal_fk
  foreign key (goal_id, user_id)
  references public.goals (id, user_id)
  on delete cascade;

alter table public.goal_habits
  add constraint goal_habits_goal_fk
  foreign key (goal_id, user_id)
  references public.goals (id, user_id)
  on delete cascade;

alter table public.goal_habits
  add constraint goal_habits_habit_fk
  foreign key (habit_id, user_id)
  references public.habits (id, user_id)
  on delete cascade;

alter table public.goal_tasks
  add constraint goal_tasks_goal_fk
  foreign key (goal_id, user_id)
  references public.goals (id, user_id)
  on delete cascade;

alter table public.goal_tasks
  add constraint goal_tasks_task_fk
  foreign key (task_id, user_id)
  references public.tasks (id, user_id)
  on delete cascade;

alter table public.finance_transactions
  add constraint finance_transactions_budget_fk
  foreign key (budget_id, user_id)
  references public.budgets (id, user_id)
  on delete restrict;

create unique index profiles_email_unique on public.profiles (email) where deleted_at is null;
create index profiles_user_id_idx on public.profiles (user_id);

create index habits_user_id_idx on public.habits (user_id);
create index habits_user_id_starts_on_idx on public.habits (user_id, starts_on desc);

create unique index habit_logs_habit_id_log_date_unique
  on public.habit_logs (habit_id, log_date)
  where deleted_at is null;
create index habit_logs_user_id_log_date_idx on public.habit_logs (user_id, log_date desc);

create unique index projects_user_id_inbox_unique
  on public.projects (user_id, is_inbox)
  where is_inbox = true and deleted_at is null;
create index projects_user_id_created_at_idx on public.projects (user_id, created_at desc);

create index tasks_user_id_due_at_idx on public.tasks (user_id, due_at asc);
create index tasks_user_id_bucket_sort_idx on public.tasks (user_id, bucket, sort_order asc);
create index tasks_project_id_idx on public.tasks (project_id);
create index tasks_parent_task_id_idx on public.tasks (parent_task_id);

create index goals_user_id_target_date_idx on public.goals (user_id, target_date asc);
create index milestones_user_id_due_at_idx on public.milestones (user_id, due_at asc);

create unique index goal_habits_goal_id_habit_id_unique
  on public.goal_habits (goal_id, habit_id)
  where deleted_at is null;
create unique index goal_tasks_goal_id_task_id_unique
  on public.goal_tasks (goal_id, task_id)
  where deleted_at is null;

create unique index journal_entries_user_id_entry_date_unique
  on public.journal_entries (user_id, entry_date)
  where deleted_at is null;
create index journal_entries_user_id_entry_date_idx on public.journal_entries (user_id, entry_date desc);

create index health_metrics_user_id_metric_date_idx
  on public.health_metrics (user_id, metric_date desc);
create index health_metrics_user_id_metric_type_metric_date_idx
  on public.health_metrics (user_id, metric_type, metric_date desc);

create index budgets_user_id_period_start_idx on public.budgets (user_id, period_start desc);
create index finance_transactions_user_id_occurred_on_idx
  on public.finance_transactions (user_id, occurred_on desc);
create index finance_transactions_user_id_category_occurred_on_idx
  on public.finance_transactions (user_id, category, occurred_on desc);
create index finance_transactions_budget_id_idx on public.finance_transactions (budget_id);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_habits_updated_at
before update on public.habits
for each row
execute function public.set_updated_at();

create trigger set_habit_logs_updated_at
before update on public.habit_logs
for each row
execute function public.set_updated_at();

create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

create trigger set_tasks_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

create trigger set_goals_updated_at
before update on public.goals
for each row
execute function public.set_updated_at();

create trigger set_milestones_updated_at
before update on public.milestones
for each row
execute function public.set_updated_at();

create trigger set_goal_habits_updated_at
before update on public.goal_habits
for each row
execute function public.set_updated_at();

create trigger set_goal_tasks_updated_at
before update on public.goal_tasks
for each row
execute function public.set_updated_at();

create trigger set_journal_entries_updated_at
before update on public.journal_entries
for each row
execute function public.set_updated_at();

create trigger set_health_metrics_updated_at
before update on public.health_metrics
for each row
execute function public.set_updated_at();

create trigger set_budgets_updated_at
before update on public.budgets
for each row
execute function public.set_updated_at();

create trigger set_finance_transactions_updated_at
before update on public.finance_transactions
for each row
execute function public.set_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.goals enable row level security;
alter table public.milestones enable row level security;
alter table public.goal_habits enable row level security;
alter table public.goal_tasks enable row level security;
alter table public.journal_entries enable row level security;
alter table public.health_metrics enable row level security;
alter table public.budgets enable row level security;
alter table public.finance_transactions enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = user_id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = user_id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "profiles_delete_own"
on public.profiles
for delete
using (auth.uid() = user_id);

create policy "habits_select_own"
on public.habits
for select
using (auth.uid() = user_id);

create policy "habits_insert_own"
on public.habits
for insert
with check (auth.uid() = user_id);

create policy "habits_update_own"
on public.habits
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "habits_delete_own"
on public.habits
for delete
using (auth.uid() = user_id);

create policy "habit_logs_select_own"
on public.habit_logs
for select
using (auth.uid() = user_id);

create policy "habit_logs_insert_own"
on public.habit_logs
for insert
with check (auth.uid() = user_id);

create policy "habit_logs_update_own"
on public.habit_logs
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "habit_logs_delete_own"
on public.habit_logs
for delete
using (auth.uid() = user_id);

create policy "projects_select_own"
on public.projects
for select
using (auth.uid() = user_id);

create policy "projects_insert_own"
on public.projects
for insert
with check (auth.uid() = user_id);

create policy "projects_update_own"
on public.projects
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "projects_delete_own"
on public.projects
for delete
using (auth.uid() = user_id);

create policy "tasks_select_own"
on public.tasks
for select
using (auth.uid() = user_id);

create policy "tasks_insert_own"
on public.tasks
for insert
with check (auth.uid() = user_id);

create policy "tasks_update_own"
on public.tasks
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "tasks_delete_own"
on public.tasks
for delete
using (auth.uid() = user_id);

create policy "goals_select_own"
on public.goals
for select
using (auth.uid() = user_id);

create policy "goals_insert_own"
on public.goals
for insert
with check (auth.uid() = user_id);

create policy "goals_update_own"
on public.goals
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "goals_delete_own"
on public.goals
for delete
using (auth.uid() = user_id);

create policy "milestones_select_own"
on public.milestones
for select
using (auth.uid() = user_id);

create policy "milestones_insert_own"
on public.milestones
for insert
with check (auth.uid() = user_id);

create policy "milestones_update_own"
on public.milestones
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "milestones_delete_own"
on public.milestones
for delete
using (auth.uid() = user_id);

create policy "goal_habits_select_own"
on public.goal_habits
for select
using (auth.uid() = user_id);

create policy "goal_habits_insert_own"
on public.goal_habits
for insert
with check (auth.uid() = user_id);

create policy "goal_habits_update_own"
on public.goal_habits
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "goal_habits_delete_own"
on public.goal_habits
for delete
using (auth.uid() = user_id);

create policy "goal_tasks_select_own"
on public.goal_tasks
for select
using (auth.uid() = user_id);

create policy "goal_tasks_insert_own"
on public.goal_tasks
for insert
with check (auth.uid() = user_id);

create policy "goal_tasks_update_own"
on public.goal_tasks
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "goal_tasks_delete_own"
on public.goal_tasks
for delete
using (auth.uid() = user_id);

create policy "journal_entries_select_own"
on public.journal_entries
for select
using (auth.uid() = user_id);

create policy "journal_entries_insert_own"
on public.journal_entries
for insert
with check (auth.uid() = user_id);

create policy "journal_entries_update_own"
on public.journal_entries
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "journal_entries_delete_own"
on public.journal_entries
for delete
using (auth.uid() = user_id);

create policy "health_metrics_select_own"
on public.health_metrics
for select
using (auth.uid() = user_id);

create policy "health_metrics_insert_own"
on public.health_metrics
for insert
with check (auth.uid() = user_id);

create policy "health_metrics_update_own"
on public.health_metrics
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "health_metrics_delete_own"
on public.health_metrics
for delete
using (auth.uid() = user_id);

create policy "budgets_select_own"
on public.budgets
for select
using (auth.uid() = user_id);

create policy "budgets_insert_own"
on public.budgets
for insert
with check (auth.uid() = user_id);

create policy "budgets_update_own"
on public.budgets
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "budgets_delete_own"
on public.budgets
for delete
using (auth.uid() = user_id);

create policy "finance_transactions_select_own"
on public.finance_transactions
for select
using (auth.uid() = user_id);

create policy "finance_transactions_insert_own"
on public.finance_transactions
for insert
with check (auth.uid() = user_id);

create policy "finance_transactions_update_own"
on public.finance_transactions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "finance_transactions_delete_own"
on public.finance_transactions
for delete
using (auth.uid() = user_id);
