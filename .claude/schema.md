# Database Schema

> **Collaboration-ready rule:** Every table includes `workspace_id`. RLS policies scope to `workspace_members`, not `user_id` directly. Currently each user has one workspace — multi-user unlock is simply allowing multiple members per workspace. Do not deviate from this pattern.

---

## Tables

### workspaces
```sql
create table workspaces (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text unique not null,
  color           text not null default '#6366f1',
  owner_id        uuid references auth.users(id) not null,
  timezone        text not null default 'America/New_York',
  end_of_day_time time not null default '17:00',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
```

### workspace_members
```sql
create table workspace_members (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete cascade,
  role         text not null default 'owner', -- 'owner' | 'editor' | 'viewer'
  joined_at    timestamptz default now(),
  unique(workspace_id, user_id)
);
```

### profiles
> 1:1 with auth.users. Does NOT use workspace_id — user-scoped, not workspace-scoped.
> `theme` is stored here so preference persists across sessions and devices.
```sql
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  theme        text not null default 'light', -- 'light' | 'dark'
  updated_at   timestamptz default now()
);

-- Auto-create profile on signup
create or replace function create_profile_for_user()
returns trigger as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function create_profile_for_user();
```

### projects
```sql
create table projects (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name         text not null,
  description  text,
  color        text not null default '#6366f1',
  status       text not null default 'active', -- 'active' | 'archived'
  default_view text not null default 'board',  -- 'board' | 'list' | 'calendar' | 'timeline'
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
```

### labels
> Workspace-wide — shared across all projects. One label pool per workspace.
> Enables coherent label filtering in cross-project views (My Day, Matrix, Dashboard, Inbox).
> Collaboration-ready: new members immediately see all labels.
```sql
create table labels (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name         text not null,
  color        text not null
);
```

### tasks
```sql
create table tasks (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid references workspaces(id) on delete cascade,
  project_id      uuid references projects(id) on delete cascade, -- null = inbox
  parent_id       uuid references tasks(id) on delete cascade,    -- null = top-level task
  title           text not null,
  description     text,
  status          text not null default 'todo',
  priority        text not null default 'medium',
  assignee_id     uuid references auth.users(id),
  due_date        date,
  estimated_mins  integer,
  position        float not null default 0,
  is_archived     boolean not null default false,
  is_recurring    boolean not null default false,
  recurrence_rule text,
  snoozed_until   timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
```
> **Query rule:** Every task query in `lib/tasks.ts` must filter `is_archived = false` and `(snoozed_until is null or snoozed_until < now())` unless explicitly building an archive or snooze view.

> **Position rule:** Application code must always calculate and set `position` explicitly on create. Never rely on the DB default of `0` — all tasks defaulting to 0 breaks fractional indexing. On create, set `position = max(existing positions) + 1.0`.

### task_labels
```sql
create table task_labels (
  task_id  uuid references tasks(id) on delete cascade,
  label_id uuid references labels(id) on delete cascade,
  primary key (task_id, label_id)
);
```

### task_dependencies
```sql
create table task_dependencies (
  task_id       uuid references tasks(id) on delete cascade,
  depends_on_id uuid references tasks(id) on delete cascade,
  primary key (task_id, depends_on_id)
);
```

### task_links
> "Related to" — bidirectional. A single row `(A, B)` means both tasks are linked.
> **Query rule:** Always query both directions: `task_id = X OR linked_task_id = X`.
> Never write two rows per link — the bidirectionality is handled in application code queries.
```sql
create table task_links (
  task_id        uuid references tasks(id) on delete cascade,
  linked_task_id uuid references tasks(id) on delete cascade,
  primary key (task_id, linked_task_id)
);
```

### task_watchers
> Collaboration-ready shell. Not surfaced in UI yet — enables task follow/notification system in v2.
```sql
create table task_watchers (
  task_id  uuid references tasks(id) on delete cascade,
  user_id  uuid references auth.users(id) on delete cascade,
  primary key (task_id, user_id)
);
```

### task_comments
> `workspace_id` included for direct RLS — avoids joining through tasks.
```sql
create table task_comments (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  task_id      uuid references tasks(id) on delete cascade,
  user_id      uuid references auth.users(id),
  body         text not null,
  created_at   timestamptz default now()
);
```

### activity_log
```sql
create table activity_log (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  task_id      uuid references tasks(id) on delete cascade,
  user_id      uuid references auth.users(id),
  action       text not null, -- 'created' | 'updated' | 'status_changed' | 'comment_added' | 'assigned'
  payload      jsonb,         -- { field, from, to }
  created_at   timestamptz default now()
);
```

### time_entries
> `workspace_id` included for direct RLS — avoids joining through tasks.
```sql
create table time_entries (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid references workspaces(id) on delete cascade,
  task_id       uuid references tasks(id) on delete cascade,
  user_id       uuid references auth.users(id),
  started_at    timestamptz not null,
  ended_at      timestamptz,
  duration_mins integer,
  note          text,
  created_at    timestamptz default now()
);
```

### my_day
> Personal — no workspace_id. RLS uses `user_id = auth.uid()` directly.
> Clears by date column: always filter `date = current_date` in queries.
```sql
create table my_day (
  id      uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  date    date not null default current_date,
  unique(task_id, user_id, date)
);
```

### saved_filters
> Per-user (not workspace-shared). `workspace_id` kept for cascade delete when workspace is deleted.
```sql
create table saved_filters (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete cascade,
  name         text not null,
  filters      jsonb not null,
  created_at   timestamptz default now()
);
```

### templates
> Workspace-shared — intentional. All members see and can use templates.
```sql
create table templates (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name         text not null,
  type         text not null default 'task', -- 'task' | 'project' — for future differentiation
  structure    jsonb not null,
  created_at   timestamptz default now()
);
```

### notifications
> Collaboration-ready shell. Not surfaced in UI yet — wired up in v2 when multi-user is enabled.
```sql
create table notifications (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete cascade,
  type         text not null,        -- 'task_assigned' | 'comment_added' | 'mentioned' | 'due_soon'
  task_id      uuid references tasks(id) on delete cascade,
  actor_id     uuid references auth.users(id),
  payload      jsonb,
  read_at      timestamptz,          -- null = unread
  created_at   timestamptz default now()
);
```

### ai_usage
```sql
create table ai_usage (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id      uuid references auth.users(id),
  route        text not null,
  tokens_in    integer,
  tokens_out   integer,
  duration_ms  integer,
  created_at   timestamptz default now()
);
```

---

## Triggers & constraints

```sql
-- updated_at trigger function (shared)
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger workspaces_updated_at  before update on workspaces  for each row execute function update_updated_at();
create trigger projects_updated_at    before update on projects     for each row execute function update_updated_at();
create trigger tasks_updated_at       before update on tasks        for each row execute function update_updated_at();

-- Enum constraints
alter table tasks add constraint tasks_status_check
  check (status in ('todo', 'in_progress', 'in_review', 'done'));

alter table tasks add constraint tasks_priority_check
  check (priority in ('urgent', 'high', 'medium', 'low'));

alter table workspace_members add constraint members_role_check
  check (role in ('owner', 'editor', 'viewer'));

alter table profiles add constraint profiles_theme_check
  check (theme in ('light', 'dark'));

alter table templates add constraint templates_type_check
  check (type in ('task', 'project'));
```

---

## RLS policies (run for every table)

```sql
-- Enable RLS on all tables
alter table workspaces       enable row level security;
alter table workspace_members enable row level security;
alter table profiles          enable row level security;
alter table projects          enable row level security;
alter table labels            enable row level security;
alter table tasks             enable row level security;
alter table task_labels       enable row level security;
alter table task_dependencies enable row level security;
alter table task_links        enable row level security;
alter table task_watchers     enable row level security;
alter table task_comments     enable row level security;
alter table activity_log      enable row level security;
alter table time_entries      enable row level security;
alter table my_day            enable row level security;
alter table saved_filters     enable row level security;
alter table templates         enable row level security;
alter table notifications     enable row level security;
alter table ai_usage          enable row level security;

-- Helper: workspace membership check (used in most policies)
-- workspaces: members can read their own workspaces
create policy "members can access their workspaces"
on workspaces for all
using (id in (select workspace_id from workspace_members where user_id = auth.uid()));

-- workspace_members: members can see other members of shared workspaces
create policy "members can see workspace members"
on workspace_members for all
using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

-- profiles: users can read profiles of people in their workspace; update own only
create policy "workspace members can read profiles"
on profiles for select
using (
  id = auth.uid()
  or id in (
    select wm.user_id from workspace_members wm
    where wm.workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  )
);
create policy "users can update own profile"
on profiles for update
using (id = auth.uid());
create policy "users can insert own profile"
on profiles for insert
with check (id = auth.uid());

-- Standard workspace pattern (projects, tasks, labels, task_comments, time_entries,
-- activity_log, templates, ai_usage, notifications)
create policy "workspace members can access projects"
on projects for all
using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

create policy "workspace members can access tasks"
on tasks for all
using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

create policy "workspace members can access labels"
on labels for all
using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

create policy "workspace members can access task_comments"
on task_comments for all
using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

create policy "workspace members can access time_entries"
on time_entries for all
using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

create policy "workspace members can access activity_log"
on activity_log for all
using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

create policy "workspace members can access templates"
on templates for all
using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

create policy "workspace members can access ai_usage"
on ai_usage for all
using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

-- Notifications: users see only their own
create policy "users can access own notifications"
on notifications for all
using (user_id = auth.uid());

-- Junction tables: access via task membership
create policy "workspace members can access task_labels"
on task_labels for all
using (task_id in (select id from tasks where workspace_id in (
  select workspace_id from workspace_members where user_id = auth.uid()
)));

create policy "workspace members can access task_dependencies"
on task_dependencies for all
using (task_id in (select id from tasks where workspace_id in (
  select workspace_id from workspace_members where user_id = auth.uid()
)));

create policy "workspace members can access task_links"
on task_links for all
using (
  task_id in (select id from tasks where workspace_id in (
    select workspace_id from workspace_members where user_id = auth.uid()
  ))
  or
  linked_task_id in (select id from tasks where workspace_id in (
    select workspace_id from workspace_members where user_id = auth.uid()
  ))
);

create policy "workspace members can access task_watchers"
on task_watchers for all
using (task_id in (select id from tasks where workspace_id in (
  select workspace_id from workspace_members where user_id = auth.uid()
)));

-- my_day: strictly personal
create policy "users can access own my_day"
on my_day for all
using (user_id = auth.uid());

-- saved_filters: strictly personal
create policy "users can access own saved_filters"
on saved_filters for all
using (user_id = auth.uid());
```

---

## Supabase Storage

`avatars` bucket — public. Storage RLS:
```sql
-- Users can only upload/update their own avatar
create policy "users can manage own avatar"
on storage.objects for all
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
```
