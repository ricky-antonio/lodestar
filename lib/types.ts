// ─── String literal unions (match DB check constraints exactly) ──────────────

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done'
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low'
export type WorkspaceMemberRole = 'owner' | 'editor' | 'viewer'
export type Theme = 'light' | 'dark'
export type TemplateType = 'task' | 'project'
export type ProjectStatus = 'active' | 'archived'
export type ProjectDefaultView = 'board' | 'list' | 'calendar' | 'timeline'
export type NotificationType = 'task_assigned' | 'comment_added' | 'mentioned' | 'due_soon'
export type ActivityAction =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'comment_added'
  | 'assigned'

// ─── Database row types ───────────────────────────────────────────────────────

export interface Workspace {
  id: string
  name: string
  slug: string
  color: string
  owner_id: string
  timezone: string
  end_of_day_time: string // stored as HH:MM
  created_at: string
  updated_at: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: WorkspaceMemberRole
  joined_at: string
}

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  theme: Theme
  updated_at: string
}

export interface Project {
  id: string
  workspace_id: string
  name: string
  description: string | null
  color: string
  status: ProjectStatus
  default_view: ProjectDefaultView
  created_at: string
  updated_at: string
}

export interface Label {
  id: string
  workspace_id: string
  name: string
  color: string
}

export interface Task {
  id: string
  workspace_id: string
  project_id: string | null // null = inbox
  parent_id: string | null  // null = top-level task
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assignee_id: string | null
  due_date: string | null   // YYYY-MM-DD
  estimated_mins: number | null
  position: number
  is_archived: boolean
  is_recurring: boolean
  recurrence_rule: string | null
  snoozed_until: string | null
  created_at: string
  updated_at: string
}

export interface TaskLabel {
  task_id: string
  label_id: string
}

export interface TaskDependency {
  task_id: string
  depends_on_id: string
}

export interface TaskLink {
  task_id: string
  linked_task_id: string
}

export interface TaskWatcher {
  task_id: string
  user_id: string
}

export interface TaskComment {
  id: string
  workspace_id: string
  task_id: string
  user_id: string | null
  body: string
  created_at: string
}

export interface ActivityPayload {
  field?: string
  from?: string | null
  to?: string | null
}

export interface ActivityLog {
  id: string
  workspace_id: string
  task_id: string | null
  user_id: string | null
  action: ActivityAction
  payload: ActivityPayload | null
  created_at: string
}

export interface TimeEntry {
  id: string
  workspace_id: string
  task_id: string | null
  user_id: string | null
  started_at: string
  ended_at: string | null
  duration_mins: number | null
  note: string | null
  created_at: string
}

export interface MyDay {
  id: string
  task_id: string
  user_id: string
  date: string // YYYY-MM-DD
}

export interface FilterState {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  assignee_id?: string[]
  label_ids?: string[]
  project_id?: string | null
  due_before?: string | null
  due_after?: string | null
  search?: string
}

export interface SavedFilter {
  id: string
  workspace_id: string
  user_id: string
  name: string
  filters: FilterState
  created_at: string
}

export interface Template {
  id: string
  workspace_id: string
  name: string
  type: TemplateType
  structure: Record<string, unknown>
  created_at: string
}

export interface Notification {
  id: string
  workspace_id: string
  user_id: string
  type: NotificationType
  task_id: string | null
  actor_id: string | null
  payload: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}

export interface AIUsage {
  id: string
  workspace_id: string
  user_id: string | null
  route: string
  tokens_in: number | null
  tokens_out: number | null
  duration_ms: number | null
  created_at: string
}

// ─── Application types ────────────────────────────────────────────────────────

export interface AppError {
  message: string  // shown to user
  code: string     // e.g. 'TASK_NOT_FOUND'
  field?: string   // form validation only
}

export interface TaskWithRelations extends Task {
  labels: Label[]
  subtasks: Task[]
  comments: TaskComment[]
  time_entries: TimeEntry[]
  linked_tasks: Task[]
  depends_on: Task[]
  dependents: Task[]
}
