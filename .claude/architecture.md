# Architecture

## Project structure
```
app/
  (auth)/           login, signup, verify-email, forgot-password, reset-password, callback
  (app)/            layout (sidebar+topbar), dashboard, inbox, my-day, matrix, projects, tasks, settings
components/
  layout/           Sidebar, BottomNav (mobile), Topbar, CommandPalette, QuickCapture,
                    KeyboardShortcutSheet, UndoToast
  views/            BoardView, ListView, CalendarView, TimelineView, MatrixView, MyDayView, InboxView
  task/             TaskCard, TaskRow, TaskDetail, TaskForm, SubtaskList, CommentThread, ActivityFeed,
                    TimeTracker, DependencyPicker, LinkedTaskPicker, SlashCommandMenu,
                    DueDateQuickPick, SnoozeMenu
  dashboard/        StatsCards, StreakCard, OverdueTasks, UpcomingDeadlines, ActivityChart,
                    WorkloadChart, EndOfDaySummary
  ai/               AICommandBar, AITaskBreakdown, AIPriorityAdvisor, WeeklyDigest,
                    StaleTaskDetector, MeetingAgendaBuilder, SmartScheduler
  shared/           PriorityBadge, StatusBadge, LabelPill, DatePicker, FilterBar, SearchInput,
                    EmptyState, ErrorBanner, RelativeTime
lib/
  supabase/         client.ts, server.ts     # client.ts = browser client; server.ts = SSR client
  ai/               tasks.ts, digest.ts, scheduling.ts
  context/          TasksContext, ProjectsContext, AuthContext, UIContext
  tasks.ts          all Supabase task queries
  projects.ts       all Supabase project queries
  time.ts
  keyboard.ts
  types.ts
middleware.ts       # root-level — Next.js auth redirect middleware (imports from lib/supabase/server.ts)
tests/              mirrors lib/ and components/ structure
```

---

## Server vs Client components

Next.js App Router: default is Server Component. Add `'use client'` only when needed.

| Use Server Component | Use Client Component |
|---------------------|---------------------|
| Page-level data fetching | Anything with hooks (useState, useEffect, useContext) |
| Initial HTML, SEO | Interactive UI (drag and drop, forms, modals) |
| Passes data as props down | Subscribes to context |
| Auth session reads (via `lib/supabase/server.ts`) | Real-time updates, optimistic mutations |

**Pattern for pages:** Page file is a Server Component that fetches initial data and passes it as props to a Client Component shell. The shell mounts contexts and handles interactivity.

```tsx
// app/(app)/projects/[id]/page.tsx  — Server Component
export default async function ProjectPage({ params }) {
  const tasks = await getTasksByProject(params.id)  // lib/tasks.ts, uses server client
  return <ProjectView initialTasks={tasks} projectId={params.id} />
}

// components/views/ProjectView.tsx  — Client Component
'use client'
export function ProjectView({ initialTasks, projectId }) {
  // mounts into TasksContext, handles board/list/etc
}
```

---

## State management

Four React contexts — no Zustand/Redux unless complexity clearly demands it.

| Context | Owns |
|---------|------|
| `TasksContext` | tasks for the **active project** (or inbox), CRUD handlers, active filters |
| `ProjectsContext` | all projects in workspace, active project |
| `AuthContext` | user, workspace, session, user profile (incl. theme) |
| `UIContext` | panel open state, active view, command palette open, undo stack |

**Scope rule:** `TasksContext` holds tasks for the active project only — not all workspace tasks. Workspace-wide operations (search, dashboard stats) query the DB directly via `lib/tasks.ts`, they don't read from context.

**Rules:**
- Server state (Supabase) → domain contexts
- UI state (open panels, selections) → `UIContext` or local `useState`
- Never put Supabase query logic inside a context — call `lib/` helpers from context handlers
- Context providers wrap `app/(app)/layout.tsx` only, not the root layout

---

## Data fetching rules

- All Supabase queries in `lib/tasks.ts` / `lib/projects.ts` — never raw queries in components
- Always specify columns explicitly — never `select *`
- Optimistic UI on every mutation: snapshot → update → try DB → catch → rollback + toast
- RLS enforces access control — never filter by `user_id` in application code

### Standard task query filters (always apply unless building specific views)
Every `lib/tasks.ts` function that returns a task list must apply these unless explicitly overridden:
```ts
.eq('is_archived', false)
.or('snoozed_until.is.null,snoozed_until.lt.' + new Date().toISOString())
```
The archive view and snooze view are the only places that bypass these filters.

### task_links query pattern (bidirectional)
A single row `(A, B)` means A and B are linked. Always query both columns:
```ts
.or(`task_id.eq.${taskId},linked_task_id.eq.${taskId}`)
```
Never store two rows per link.

### Saved filters query pattern (per-user)
Always filter by `user_id` — RLS enforces this but be explicit:
```ts
.eq('user_id', userId)
```

## Optimistic UI pattern (always follow this)
```ts
const previous = items
setItems(optimisticallyUpdated)
try {
  await updateInDB(item)
} catch {
  setItems(previous)
  showErrorToast('Failed to update. Changes reverted.')
}
```

---

## Theme persistence

Theme preference is stored in `profiles.theme`. On app load:
1. `AuthContext` reads `profiles.theme` for the current user
2. Sets `next-themes` accordingly via `setTheme`
3. On theme toggle: update `profiles.theme` in DB, update `next-themes` immediately (optimistic)

Default: `'light'` (DB default). `next-themes` `defaultTheme="light"`.

---

## Quick capture + AI date extraction

Quick capture saves the task immediately (feels instantaneous). AI date extraction runs **after** save:
1. Task saved to DB with no due date
2. `extractDueDate(title)` called async in background
3. If a date is detected, a toast appears: "Due date found: Friday. Add it?" with Accept/Dismiss
4. Accepting calls `updateTask({ due_date })` — standard optimistic update

This means quick capture never blocks on the AI call.

---

## API routes
```
POST /api/ai/create-task        natural language → structured task preview
POST /api/ai/breakdown          task title → subtask suggestions
POST /api/ai/suggest-priorities task list → priority change suggestions
POST /api/ai/write-description  task title + /ai → continued description
POST /api/ai/weekly-digest      task stats → digest narrative
POST /api/ai/workload-advice    task list + due dates → workload assessment
POST /api/ai/extract-due-date   task title → extracted date or null
POST /api/ai/stale-tasks        stale task list → suggested actions
POST /api/ai/meeting-agenda     project tasks → structured agenda
POST /api/ai/smart-schedule     this week's tasks → day-by-day plan
```

All AI routes: validate input, rate-limit per user (10 req/min via `@upstash/ratelimit`), call Anthropic (`claude-sonnet-4-20250514`, `max_tokens: 1000`), log to `ai_usage`.

---

## Error shape (use everywhere)
```ts
interface AppError {
  message: string  // human-readable, shown to user
  code: string     // machine-readable, e.g. 'TASK_NOT_FOUND'
  field?: string   // form validation only
}
```

## Dynamic imports (heavy components)
Apply to: TimelineView, CalendarView, all Chart.js components, CommandPalette.
```ts
const TimelineView = dynamic(() => import('@/components/views/TimelineView'), { loading: () => <Skeleton /> })
```

---

## Key patterns

**Fractional indexing:** `position` is a float. On create, set `position = max(existing) + 1.0`. On drag between two items, set `position = (a.position + b.position) / 2`. Never reindex all tasks.

**`updated_at`:** Managed by DB trigger on `tasks`, `projects`, `workspaces`. Never set it manually in application code.

**Content sanitization:** All user-generated HTML through `DOMPurify.sanitize()` before `dangerouslySetInnerHTML`. Apply to task descriptions and comments.

**Session expiry:** Root `middleware.ts` catches Supabase auth errors → redirects to `/login?reason=expired`. Login page shows banner when `reason=expired` in query string.

**Collaboration unlock path:** To enable multi-user: (1) allow multiple `workspace_members` per workspace, (2) build invite flow, (3) surface `notifications` table, (4) surface `task_watchers`. Schema and RLS are already ready. No migrations needed.
