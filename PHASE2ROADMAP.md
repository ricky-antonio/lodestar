# Phase 2 — Views Roadmap

> **PREREQUISITE: All PHASE1ROADMAP.md prompts must be complete before starting
> this file. Check PROGRESS.md — if Phase 1 is still in progress, stop here.**

Each prompt is self-contained. Paste it into a fresh context window. The required
reading step keeps Claude aligned with project rules.

Run `npm test` and `npm run type-check` at the end of every prompt. Fix all failures
before moving on.

---

## Dependency map

```
PROMPT 0   Validate & commit existing foundation work   ← do first
PROMPT 1   TaskForm                                     ← no deps
PROMPT 2   TaskRow                                      ← no deps
P1.8       Undo toast integration                       ← do immediately after PROMPT 2
PROMPT 3   TaskList (virtualized + drag)                ← needs PROMPT 1 + 2
PROMPT 4   Inbox page                                   ← needs PROMPT 3
PROMPT 5   My Day page                                  ← needs PROMPT 3
PROMPT 6   TaskDetail panel                             ← needs PROMPT 1 + 2
PROMPT 7   Subtasks                                     ← needs PROMPT 6
PROMPT 8   Labels                                       ← needs PROMPT 6
PROMPT 9   Filter bar                                   ← needs PROMPT 4 + 5
PROMPT 10  BoardView                                    ← needs PROMPT 1 + 2
PROMPT 11  ListView                                     ← needs PROMPT 1 + 2
PROMPT 12  Task dependencies & linked tasks             ← needs PROMPT 6
PROMPT 13  Due date quick pick + Snooze                 ← needs PROMPT 6
P1.9       Keyboard reference sheet                     ← do after PROMPT 13 (all shortcuts defined)
PROMPT 14  Phase 2 close-out checklist                  ← do last
```

---

## PROMPT 0 — Validate & commit existing Phase 2 foundation

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/2-views.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

There is a batch of uncommitted Phase 2 foundation work. Before building anything
new, audit and validate it:

1. Run `npm run type-check` — fix every TypeScript error before continuing.
2. Run `npm test` — fix every failing test before continuing.
3. Run `npm run test:coverage` — confirm Phase 1 thresholds still hold
   (Lines ≥ 70%, Functions ≥ 70%, Branches ≥ 65%). Fix gaps if needed.
4. Run `npm run build` — fix any build errors.

The uncommitted files are:
  app/(app)/layout.tsx, app/providers.tsx
  app/(app)/dashboard/page.tsx
  components/layout/Sidebar.tsx, BottomNav.tsx, Topbar.tsx
  lib/context/AuthContext.tsx, ProjectsContext.tsx, TasksContext.tsx, UIContext.tsx
  lib/projects.ts, lib/tasks.ts
  lib/supabase/admin.ts, lib/supabase/route-handler.ts
  tests/components/AuthContext.test.tsx, ProjectsContext.test.tsx,
    TasksContext.test.tsx, UIContext.test.tsx
  tests/components/layout/Sidebar.test.tsx, BottomNav.test.tsx, Topbar.test.tsx
  tests/lib/projects.test.ts, tests/lib/tasks.test.ts

Read each file before deciding whether it needs changes. Do not rewrite files that
are correct — only fix what fails type-check or tests.

After all four checks pass, commit all untracked/modified files with a message
describing the Phase 2 foundation. Update PROGRESS.md: mark "App shell, contexts,
data helpers, layout components, and their tests" complete. Next task = TaskForm.
```

---

## PROMPT 1 — TaskForm component

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/2-views.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

Build `components/tasks/TaskForm.tsx` — a Dialog-based modal for creating and editing
tasks.

Read .claude/design.md and .claude/schema.md before writing any code.

Props interface:
  open: boolean
  onClose: () => void
  initialValues?: Partial<Task>   // present when editing; absent when creating
  onSubmit: (values: TaskFormValues) => Promise<void>

TaskFormValues = {
  title: string
  description?: string
  priority: TaskPriority
  due_date?: string
  project_id?: string | null
  estimated_mins?: number | null
}

Fields:
  - Title (required, text input, auto-focused on open)
  - Description (textarea, optional)
  - Priority (4-segment button group: urgent / high / medium / low —
    use priority colors from design.md)
  - Due date (date input, optional)
  - Project (select from useProjects().projects — "No project" as first option)
  - Estimated minutes (number input, optional, labelled "Est. mins")

Behavior:
  - Submitting with empty title shows inline validation error; does not call onSubmit
  - Calls onSubmit and closes on success
  - Submit button shows spinner + is disabled while onSubmit is pending
  - Escape closes (shadcn Dialog handles this)
  - Form resets on re-open (key the Dialog on `open` to force remount)

Use shadcn Dialog, Input, Textarea, Button. Use useProjects() for the project list.

Tests — `tests/components/tasks/TaskForm.test.tsx`:
  - All fields visible on render
  - Submitting empty title shows validation error; onSubmit not called
  - Fills all fields and submits — onSubmit called with correct values
  - onClose called when cancel clicked
  - initialValues pre-populate fields (editing flow)
  - Submit button disabled while onSubmit is pending

Always import mocks from tests/mocks/supabase.ts. vi.clearAllMocks() in beforeEach.
Use mockResolvedValueOnce, never bare mockResolvedValue.

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark TaskForm complete, next = TaskRow.
```

---

## PROMPT 2 — TaskRow component

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/2-views.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

Build `components/tasks/TaskRow.tsx` — a single task row used in list views.

Read .claude/design.md before writing.

Props:
  task: Task
  onToggleDone: (id: string) => void
  onEdit: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  dragHandleProps?: React.HTMLAttributes<HTMLElement>

Layout (left to right):
  - Drag handle (IconGripVertical 16px, visible on row hover only,
    aria-label="Drag to reorder")
  - Checkbox circle: clicking calls onToggleDone; done = strikethrough + muted color
  - Priority dot: 8px filled circle
    urgent=red, high=orange, medium=cerulean, low=steel (colors from design.md)
  - Title: truncated single line; clicking opens inline edit (input on click,
    blur saves via onEdit)
  - Due date badge: formatted "May 14"; overdue dates shown in red
  - Three-dot menu (IconDotsVertical): Edit, Archive, Delete options

Accessibility:
  - All interactive elements keyboard-accessible
  - Three-dot menu focusable via keyboard tab (not hover-only)
  - Icon-only buttons need aria-label
  - Minimum 44px tap target on mobile

Tests — `tests/components/tasks/TaskRow.test.tsx`:
  - Renders task title
  - Clicking checkbox calls onToggleDone with task id
  - Done task shows strikethrough on title
  - Edit option in dropdown calls onEdit with task id
  - Archive option calls onArchive with task id
  - Delete option calls onDelete with task id
  - Overdue task renders date in red
  - Drag handle has aria-label "Drag to reorder"

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark TaskRow complete, next = Undo toast integration.
```

---

## P1.8 — Undo toast integration *(Phase 1 completion item — do immediately after PROMPT 2)*

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/1-foundation.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.

PREREQUISITE: PROMPT 2 (TaskRow) must be complete before this prompt.
The undo toast is wired to archive and delete actions in TaskRow.

UIContext already has pushUndo / dismissUndo / undoStack.
The Toast component (P1.2) already renders undoStack items.

Wire the undo actions into TaskRow:

In `components/tasks/TaskRow.tsx`, replace the direct onArchive / onDelete calls
with wrapped versions that push an undo item first:

Archive:
  1. Call onArchive(task.id) immediately (optimistic — TasksContext handles rollback)
  2. Push to UIContext:
       pushUndo({
         label: `Archived "${task.title}"`,
         message: `Archived "${task.title}"`,
         undo: () => editTask(id, { is_archived: false }),
       })
  3. Auto-dismiss after 5s (Toast component handles this already)

Delete:
  1. Call onDelete(task.id) immediately
  2. Push to UIContext:
       pushUndo({
         label: `Deleted "${task.title}"`,
         message: `Deleted "${task.title}"`,
         undo: () => { /* re-create not possible — notify user */ },
       })
     For delete, the undo button is not shown (undo is impossible after DB delete).
     The toast just confirms the action. Only show an × dismiss button.

To distinguish "has undo action" from "confirmation only", add a boolean to UndoItem:
  canUndo?: boolean  (default true)
In Toast.tsx: show "Undo" button only when canUndo !== false.

Update the UndoItem interface in UIContext.tsx. Update Toast.tsx accordingly.

Update `tests/components/tasks/TaskRow.test.tsx`:
  - Archive calls pushUndo with correct label
  - Delete calls pushUndo without an undo button (canUndo false)

Update `tests/components/ui/Toast.test.tsx`:
  - Toast with canUndo: false does not render "Undo" button

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark Undo toast integration complete, next = TaskList.
```

---

## PROMPT 3 — TaskList (virtualized + drag-to-reorder)

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/2-views.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

Build `components/tasks/TaskList.tsx` — virtualized, draggable task list.

Read .claude/design.md before writing. Requires @tanstack/react-virtual and
@dnd-kit/core + @dnd-kit/sortable (already installed).

Props:
  tasks: Task[]
  onToggleDone: (id: string) => void
  onEdit: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onReorder: (taskId: string, newPosition: number) => void
  emptyMessage?: string

Implementation:
  - useVirtualizer from @tanstack/react-virtual, estimateSize: () => 48
  - DndContext + SortableContext (verticalListSortingStrategy)
  - Each row wrapped in useSortable; pass attributes + listeners as dragHandleProps
  - onDragEnd: compute new position with getFractionalPosition from lib/tasks,
    call onReorder
  - PointerSensor with activationConstraint: { delay: 250, tolerance: 5 }
  - Empty state: centered emptyMessage or "No tasks"

Tests — `tests/components/tasks/TaskList.test.tsx`:
  - Renders all task titles
  - Empty message shown when tasks is empty
  - onToggleDone called when TaskRow checkbox triggered
  - onReorder called with correct taskId and position after drag end

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark TaskList complete, next = Inbox page.
```

---

## PROMPT 4 — Inbox page

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/2-views.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

Build `app/(app)/inbox/page.tsx` — unscheduled tasks with quick capture.

Read .claude/design.md before writing. This is a client component.
Uses useTasks() and useUI().

Layout:
  - Page header: "Inbox" heading + task count badge + "New task" button
  - Quick capture bar: text input at the top ("Capture a task…")
    Enter creates a task with the typed title and project_id=null; input clears.
    No AI extraction — save immediately, title only.
  - TaskList filtered to tasks where project_id === null
  - TaskDetail panel rendered when UIContext.detailTaskId is set (slide-in right)
  - TaskForm Dialog (controlled by local state, opened by "New task" button or
    Edit in TaskRow three-dot menu)

Wire TaskList callbacks to TasksContext (addTask, editTask, removeTask, archiveTask).
Reorder: call editTask(id, { position: newPosition }).
Title click on TaskRow: call useUI().openDetail(taskId).

Also update `app/(app)/dashboard/page.tsx` to show real stats using useTasks():
  - Tasks due today (due_date === today's ISO date)
  - Overdue (due_date < today, status !== 'done')
  - Completed this week (status === 'done', updated_at within last 7 days)
  - In progress (status === 'in_progress')
Replace the placeholder dashes with these counts.

Tests — `tests/components/inbox/InboxPage.test.tsx`:
  - Renders "Inbox" heading
  - Quick capture input present
  - Typing title + Enter calls addTask with correct title and project_id null
  - TaskList rendered with inbox tasks
  - "New task" button opens TaskForm

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark Inbox page complete, next = My Day page.
```

---

## PROMPT 5 — My Day page

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/2-views.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

Build `app/(app)/my-day/page.tsx` — tasks due today plus manually pinned tasks.

Read .claude/design.md and .claude/schema.md before writing.

Pinning: use a local React Set<string> in component state. No DB column needed.
"Add to My Day" appears in the TaskRow three-dot menu for tasks not due today and
not already pinned. "Remove from My Day" appears for pinned tasks.

Layout:
  - Page header: "My Day" + today's formatted date (e.g. "Wednesday, May 14") +
    task count
  - "Due today" section: tasks where due_date === today's ISO string
  - "Added to My Day" section: pinned tasks (hidden when empty)
  - Each section uses TaskList; empty sections not rendered
  - "New task" button opens TaskForm with due_date pre-set to today
  - TaskDetail panel when UIContext.detailTaskId is set

Wire callbacks to TasksContext.

Tests — `tests/components/my-day/MyDayPage.test.tsx`:
  - Renders "My Day" heading with today's date
  - Tasks due today appear in "Due today" section
  - Tasks not due today are absent by default
  - "Add to My Day" in dropdown adds task to "Added to My Day" section
  - "Remove from My Day" removes it from that section

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark My Day complete, next = TaskDetail panel.
```

---

## PROMPT 6 — TaskDetail panel

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/2-views.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

Build `components/tasks/TaskDetail.tsx` — slide-in detail panel.

Read .claude/design.md before writing.

Triggered by UIContext.detailTaskId. Fixed position, full height, 400px wide on
desktop, full-screen on mobile. Clicking the backdrop or pressing Escape calls
UIContext.closeDetail(). Find the task from TasksContext.tasks — if not found,
close automatically.

Inline-editable fields (all save via editTask on change/blur):
  - Title (large text, editable on click, save on blur)
  - Status (dropdown: todo / in_progress / done, saves immediately)
  - Priority (4-button group, saves immediately)
  - Due date (date input, saves on change)
  - Project (select from useProjects().projects, saves on change)
  - Description (textarea, saves on blur)
  - Estimated minutes (number input, saves on blur)

All saves use editTask — optimistic, rollback on failure.

Stub sections (filled in later prompts):
  - "Subtasks" header + "— coming soon" placeholder
  - "Labels" header + placeholder
  - "Dependencies" header + placeholder
  - "Activity" header + placeholder

Header: X close button (aria-label="Close detail panel"), Archive button,
Delete button (with confirmation).

Tests — `tests/components/tasks/TaskDetail.test.tsx`:
  - Returns null when detailTaskId is null
  - Renders task title when detailTaskId matches a task
  - Close button calls UIContext.closeDetail
  - Changing status dropdown calls editTask with new status
  - Editing title and blurring calls editTask with new title
  - Archive button calls archiveTask
  - Delete button calls removeTask

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark TaskDetail complete, next = Subtasks.
```

---

## PROMPT 7 — Subtasks

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/2-views.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

Build subtask support. Subtasks are tasks with a non-null parent_id.

Read .claude/schema.md to confirm tasks table columns.

Step 1 — `lib/subtasks.ts`:
  - getSubtasks(parentId: string): Promise<Task[]>
  - createSubtask(workspaceId: string, parentId: string, title: string): Promise<Task>
  - toggleSubtask(id: string, done: boolean): Promise<void>
    Updates status to 'done' or 'todo'

Step 2 — `tests/lib/subtasks.test.ts`:
  Each function: happy path + throws on error.

Run `npm test` after this step.

Step 3 — `components/tasks/SubtaskList.tsx`:
  Props: parentId: string; workspaceId: string
  - Loads subtasks via getSubtasks on mount
  - Progress bar: completed / total (e.g. "2 / 5 subtasks done")
  - Each subtask: checkbox + title
  - Checking/unchecking calls toggleSubtask with optimistic UI + rollback on failure
  - "Add subtask" inline input at bottom (Enter to create, Escape to cancel)

Step 4 — `tests/components/tasks/SubtaskList.test.tsx`:
  - Renders subtask titles
  - Progress bar shows correct ratio
  - Checking checkbox calls toggleSubtask; reverts on DB failure
  - Enter in add-subtask input calls createSubtask; input clears

Step 5 — Replace the "Subtasks — coming soon" stub in TaskDetail.tsx with:
  <SubtaskList parentId={task.id} workspaceId={task.workspace_id} />

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark Subtasks complete, next = Labels.
```

---

## PROMPT 8 — Labels

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/2-views.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

Build label support. Labels are workspace-wide. The `labels` table has id,
workspace_id, name, color. The `task_labels` junction table links tasks to labels.

Read .claude/schema.md for exact column names.

Step 1 — `lib/labels.ts`:
  - getLabels(workspaceId: string): Promise<Label[]>
  - createLabel(workspaceId: string, name: string, color: string): Promise<Label>
  - updateLabel(id: string, updates: Partial<Pick<Label, 'name' | 'color'>>): Promise<Label>
  - deleteLabel(id: string): Promise<void>
  - getTaskLabels(taskId: string): Promise<Label[]>
  - addLabelToTask(taskId: string, labelId: string): Promise<void>
  - removeLabelFromTask(taskId: string, labelId: string): Promise<void>

Step 2 — `tests/lib/labels.test.ts`:
  Each function: happy path + error throw.

Run `npm test` after this step.

Step 3 — `components/tasks/LabelPicker.tsx`:
  Props: taskId: string; workspaceId: string
  - Loads workspace labels + current task labels on mount
  - Popover button showing current label pills (colored badges)
  - Inside popover: checkbox list; checking adds, unchecking removes (optimistic)
  - "New label" inline form: name + 6 preset color swatches

Step 4 — `tests/components/tasks/LabelPicker.test.tsx`:
  - Renders current labels as badges
  - Checking a label calls addLabelToTask; reverts on failure
  - Unchecking calls removeLabelFromTask; reverts on failure
  - Creating a new label calls createLabel

Step 5 — Replace the "Labels — coming soon" stub in TaskDetail.tsx with:
  <LabelPicker taskId={task.id} workspaceId={task.workspace_id} />

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark Labels complete, next = Filter bar.
```

---

## PROMPT 9 — Filter bar

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/2-views.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

Build `components/filters/FilterBar.tsx` — horizontal filter bar with chips.

Read .claude/design.md. FilterState and filterTasks are already in lib/tasks.ts
and lib/types.ts.

Props:
  filters: FilterState
  onChange: (filters: FilterState) => void
  workspaceId: string

Layout (left to right):
  - Search input (IconSearch prefix, × clear button)
  - "Filter" dropdown: priority checkboxes (urgent/high/medium/low) +
    status checkboxes (todo/in_progress/done)
  - "Due date" dropdown: Today / This week / Overdue
    (compute dates dynamically from today — never hardcode)
  - "Label" dropdown: loads labels via getLabels, checkbox list, sets label_ids
  - Active filter chips between buttons: each shows what's active + × to remove
  - "Clear all" button shown only when any filter is active

Wire FilterBar into Inbox page and My Day page (above TaskList, pass
TasksContext.filters and TasksContext.setFilters).

Tests — `tests/components/filters/FilterBar.test.tsx`:
  - Renders search input
  - Typing in search calls onChange with updated search
  - Clearing search calls onChange with search undefined
  - Selecting "urgent" priority calls onChange with priority: ['urgent']
  - Removing a chip removes it from filters
  - "Clear all" resets to empty object

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark FilterBar complete, next = BoardView.
```

---

## PROMPT 10 — BoardView

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/2-views.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

Build `components/views/BoardView.tsx` — Kanban board with dnd-kit drag and drop.

Read .claude/design.md and .claude/schema.md before writing.

Props:
  tasks: Task[]
  onMoveTask: (taskId: string, newStatus: TaskStatus, newPosition: number) => void
  onEdit: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onAddTask: (status: TaskStatus) => void

Three visible columns: todo / in_progress / done. Archived tasks excluded.

Each column:
  - Header: status label + task count badge
  - Scrollable card list (overflow-y-auto)
  - "+ Add task" button at bottom, calls onAddTask(status)

Each card (card variant, not TaskRow):
  - Title (truncated to 2 lines)
  - Priority dot (colors from design.md)
  - Due date badge (red if overdue)
  - Three-dot menu: Edit, Archive, Delete

Drag behavior:
  - Within column: update position only (getFractionalPosition between neighbours)
  - Between columns: update status + position
  - Optimistic: move card immediately, call onMoveTask, revert if throws
  - PointerSensor with activationConstraint: { delay: 250, tolerance: 5 }
  - DragOverlay: ghost card during drag

Also build `app/(app)/projects/[id]/page.tsx`:
  - Reads project id from params
  - Renders FilterBar + BoardView or ListView based on UIContext.activeView
  - View toggle buttons in page header (list / board icons)

Tests — `tests/components/views/BoardView.test.tsx`:
  - Renders three columns with correct status labels
  - Tasks appear in the correct column
  - Column header shows correct count
  - Empty column renders "+ Add task"
  - onAddTask called with correct status when button clicked
  - onDragEnd triggers onMoveTask with correct taskId, newStatus, newPosition

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark BoardView complete, next = ListView.
```

---

## PROMPT 11 — ListView

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/2-views.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

Build `components/views/ListView.tsx` — sortable table with bulk selection and inline
editing.

Read .claude/design.md before writing.

Props:
  tasks: Task[]
  onEdit: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onToggleDone: (id: string) => void
  onBulkArchive: (ids: string[]) => void
  onReorder: (taskId: string, newPosition: number) => void

Columns: Checkbox | Priority | Title | Status | Due Date | Project | Actions

Column header behavior:
  - Clicking sorts ascending; clicking again reverses (asc/desc toggle)
  - Sorted column shows up/down arrow icon
  - Sort state is local (not persisted)

Inline editing:
  - Status cell: click opens dropdown (todo / in_progress / done), selecting calls
    editTask
  - Priority cell: click opens 4-option dropdown
  - Title cell: single-click opens edit input; blur saves via onEdit

Bulk selection:
  - Top-left checkbox: select/deselect all visible
  - Each row has a checkbox; checked rows tracked in local Set<string>
  - When selection non-empty: bulk action bar above list with "Archive {n} tasks"
    button calling onBulkArchive(Array.from(selectedIds))
  - Bulk archive clears selection

Uses filterTasks + sortTasks from lib/tasks.ts with current sort state.

Wire into app/(app)/projects/[id]/page.tsx (already scaffolded in PROMPT 10) and
into Inbox and My Day pages as an alternative view (toggle button in page header).

Tests — `tests/components/views/ListView.test.tsx`:
  - Renders all task titles as rows
  - Clicking a column header sorts by that field
  - Clicking same header reverses sort direction
  - Inline status dropdown calls editTask on select
  - Row checkbox adds task to selection
  - Select-all selects all rows
  - Bulk archive button calls onBulkArchive with all selected IDs

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark ListView complete, next = Task dependencies & linked tasks.
```

---

## PROMPT 12 — Task dependencies & linked tasks

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/2-views.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

Build dependency and link support.

Read .claude/schema.md for:
  task_dependencies: id, workspace_id, task_id (blocked), depends_on_id (blocking)
  task_links: id, workspace_id, task_id, linked_task_id, link_type ('related')
  task_links is bidirectional via a single row — always query:
    WHERE task_id = X OR linked_task_id = X

Step 1 — `lib/dependencies.ts`:
  - getDependencies(taskId: string): Promise<{ blockedBy: Task[]; blocking: Task[] }>
  - addDependency(workspaceId: string, taskId: string, dependsOnId: string): Promise<void>
  - removeDependency(taskId: string, dependsOnId: string): Promise<void>

Step 2 — `lib/links.ts`:
  - getLinkedTasks(taskId: string): Promise<Task[]>
    Query WHERE task_id=X OR linked_task_id=X; de-duplicate; exclude taskId itself
  - addLink(workspaceId: string, taskId: string, linkedTaskId: string): Promise<void>
  - removeLink(taskId: string, linkedTaskId: string): Promise<void>
    Delete WHERE (task_id=A AND linked_task_id=B) OR (task_id=B AND linked_task_id=A)

Step 3 — Tests:
  tests/lib/dependencies.test.ts — each function: happy path + error
  tests/lib/links.test.ts — each function: happy path + error

Run `npm test` after this step.

Step 4 — `components/tasks/TaskDependencies.tsx`:
  Props: taskId: string; allTasks: Task[]
  - Loads dependencies + linked tasks on mount
  - "Blocked by" section: blocking tasks with status badge + remove button
  - "Blocking" section: tasks this one blocks (read-only)
  - "Add dependency" searchable select from allTasks (excludes self + already linked)
  - "Related tasks" section: linked tasks with remove button + add-link picker

Step 5 — `tests/components/tasks/TaskDependencies.test.tsx`:
  - Renders "Blocked by" list
  - Remove button calls removeDependency
  - Selecting from add picker calls addDependency
  - Related tasks section renders linked tasks
  - Remove link calls removeLink

Step 6 — Replace "Dependencies — coming soon" stub in TaskDetail.tsx with:
  <TaskDependencies taskId={task.id} allTasks={tasks} />

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark dependencies & linked tasks complete, next = Due date & Snooze.
```

---

## PROMPT 13 — Due date quick pick & Snooze

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/2-views.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

Build DueDatePicker and SnoozeMenu. Use vi.useFakeTimers() in all tests.

Read .claude/design.md for Popover and button styles.

Step 1 — `components/tasks/DueDatePicker.tsx`:
  Props: value: string | null; onChange: (date: string | null) => void

  Popover button showing current due date or "Set due date".

  Quick-pick options (all computed dynamically from today — never hardcoded):
    Today / Tomorrow / This Friday / Next Monday / In 2 weeks / Clear (only if value set)

  Also a date input for custom dates.
  Storage format: YYYY-MM-DD. Display format: "May 14" or day name for near dates.

Step 2 — `components/tasks/SnoozeMenu.tsx`:
  Props: taskId: string; onSnooze: (until: string) => void

  Popover button (IconAlarmSnooze, aria-label="Snooze task").

  Options (computed dynamically):
    +3 hours / Tomorrow morning (08:00) / This weekend (Sat 09:00) /
    Next week (Mon 08:00) / Pick date (datetime input)

Step 3 — Tests:
  tests/components/tasks/DueDatePicker.test.tsx:
    vi.useFakeTimers() set to 2024-01-15 (Monday)
    - "Today" → 2024-01-15
    - "Tomorrow" → 2024-01-16
    - "This Friday" → 2024-01-19
    - "Next Monday" → 2024-01-22
    - "In 2 weeks" → 2024-01-29
    - "Clear" → null; Clear not shown when value is null

  tests/components/tasks/SnoozeMenu.test.tsx:
    vi.useFakeTimers() set to 2024-01-15T10:00:00Z
    - "+3 hours" calls onSnooze with 2024-01-15T13:00:00Z
    - "Tomorrow morning" calls onSnooze with 2024-01-16T08:00:00
    - "Next week" calls onSnooze with 2024-01-22T08:00:00

Step 4 — Integrate into TaskDetail.tsx:
  - Replace plain date input for due_date with <DueDatePicker>
  - Add <SnoozeMenu> in the task header area

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark quick pick & snooze complete, next = Keyboard reference sheet.
```

---

## P1.9 — Keyboard reference sheet *(Phase 1 completion item — do after PROMPT 13)*

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/1-foundation.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.

PREREQUISITE: Phase 2 prompts 1–13 must be complete so all keyboard shortcuts
are defined before building the reference sheet.

Build the ? keyboard reference sheet.

When the user presses ? anywhere in the app (outside inputs), open a Dialog showing
all registered shortcuts. This uses the keyboard singleton from lib/keyboard.ts.

Step 1 — `components/ui/KeyboardReferenceSheet.tsx`:
  A Dialog (shadcn) that opens on ? keypress.
  Title: "Keyboard shortcuts"
  Content: a two-column list of all keyboard.getAll() entries.
  Each row: key badge (monospace, rounded, dark) + description text.
  Close on Escape or clicking X.

  Register the ? shortcut in a useEffect (same pattern as QuickCapture).

  Render <KeyboardReferenceSheet /> in app/(app)/layout.tsx alongside QuickCapture.

Step 2 — `tests/components/ui/KeyboardReferenceSheet.test.tsx`:
  - Dialog hidden initially
  - Pressing ? opens the dialog
  - Renders at least one shortcut (mock keyboard.getAll())
  - Pressing Escape closes the dialog

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark Keyboard reference sheet complete, next = Phase 2 close-out.
```

---

## PROMPT 14 — Phase 2 close-out checklist

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/2-views.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

This is the Phase 2 close-out. Do not build new features — only validate and document.

Run all four in order. Fix everything before moving to the next:

1. npm run type-check   — zero TypeScript errors required. Fix every error.

2. npm test             — all tests pass. A failing test is never fixed by deleting
                          it — fix the code or the assertion.

3. npm run test:coverage — Phase 2 thresholds required:
     Lines ≥ 75% · Functions ≥ 75% · Branches ≥ 70%
   If below: identify the uncovered areas from the report, write the missing tests,
   re-run until thresholds pass.

4. npm run build        — production build succeeds with zero errors.

After all four pass, update PROGRESS.md:
  - Move all Phase 2 items into "Completed"
  - Set "Current phase" to "Phase 2 — Views (complete)"
  - Set "In progress" to "None — Phase 2 complete. Ready to begin Phase 3."
  - Set "Next task" to Phase 3 opening items (read .claude/phases/3-ai.md first)
  - Update "Test status" section with the actual passing numbers

Do not commit — leave that for the user.
```

---

## Summary

| Prompt | Feature | Key output |
|--------|---------|-----------|
| 0 | Validate & commit foundation | Tests green, committed |
| 1 | TaskForm | Create/edit modal |
| 2 | TaskRow | Single row with actions |
| P1.8 | Undo toast integration | Archive/delete toasts with undo |
| 3 | TaskList | Virtualized + draggable |
| 4 | Inbox page | Quick capture + dashboard stats |
| 5 | My Day page | Due today + pinned |
| 6 | TaskDetail | Slide-in panel |
| 7 | Subtasks | lib + SubtaskList + progress bar |
| 8 | Labels | lib + LabelPicker |
| 9 | Filter bar | Chips + dropdowns |
| 10 | BoardView | dnd-kit Kanban + project route |
| 11 | ListView | Sortable + bulk select |
| 12 | Dependencies & links | task_dependencies + task_links |
| 13 | Due date quick pick + Snooze | Date shortcuts + snooze menu |
| P1.9 | Keyboard reference sheet | ? dialog showing all shortcuts |
| 14 | Phase 2 close-out | Coverage ≥ 75%, PROGRESS.md updated |
