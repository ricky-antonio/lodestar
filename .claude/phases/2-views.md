# Phase 2 — Views + Organization

**Start only after Phase 1 auth checklist is complete.**

## What to build

- [ ] Board view with @dnd-kit drag and drop
  - Drag within column: updates `position` (fractional indexing)
  - Drag between columns: updates `status` + `position`
  - Optimistic UI with rollback
  - Column headers show task count
  - "+ Add task" inline form at column bottom
  - Drag handle visible on hover only
- [ ] Bulk actions on board: shift-click multi-select, bulk move/priority/archive
- [ ] Filter bar: priority, label, due date, status
- [ ] Saved filters
- [ ] Full text search via Supabase `ilike`
- [ ] Labels CRUD
- [ ] Subtasks with progress bar
- [ ] Task dependencies
- [ ] Linked tasks (lightweight "related to" — `task_links` table)
- [ ] Due date quick pick: Today / Tomorrow / This Friday / Next Monday / In 2 weeks (computed dynamically)
- [ ] Snooze: defer visibility without changing due date. Options: +3h, Tomorrow, This weekend, Next week, Pick date
- [ ] Relative timestamps in activity feed and comments
- [ ] List view enhancements: click-to-sort all columns, inline status/priority editing, bulk select

## Tests to write (Phase 2)

**`components/views/BoardView.test.tsx`:**
- Renders four columns with correct status labels
- Tasks appear in correct column
- Column header shows correct count
- Empty column renders "+ Add task"
- `onDragEnd` called with correct `taskId`, `newStatus`, `newPosition`
- Tasks maintain correct order by `position`

**`components/views/ListView.test.tsx`:**
- Renders all tasks as rows
- Click column header sorts
- Click same header reverses sort
- Inline status dropdown updates on select
- Bulk select selects all visible tasks
- Bulk archive calls handler with all selected IDs

**`components/task/TaskDetail.test.tsx`:**
- Renders all fields
- Editing title inline updates on blur
- Subtask progress bar shows correct percentage
- Dependency list renders blocked-by tasks with status

**`components/task/SubtaskList.test.tsx`:**
- Renders subtasks with checkboxes
- Checking a subtask calls status update handler
- Progress bar reflects completion ratio

## Coverage target after Phase 2
Lines ≥ 75% · Functions ≥ 75% · Branches ≥ 70%
