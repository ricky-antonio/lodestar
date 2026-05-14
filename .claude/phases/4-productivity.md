# Phase 4 — Productivity Features

## What to build

- [ ] Calendar view
- [ ] Timeline / Gantt view
- [ ] My Day view: manual curation, clears at midnight, overdue carry-over prompt, completion count
- [ ] Eisenhower matrix: 2x2 grid auto-plotted by priority + due date, drag between quadrants
- [ ] Time tracking: start/stop timer, manual entry, total on card + detail, weekly dashboard chart
- [ ] Recurring tasks: `recurrence_rule` field, options: daily/weekly/monthly/custom rrule
- [ ] Project templates + individual task templates
- [ ] Focus mode
- [ ] Activity log per task (already in schema, build the UI)
- [ ] Comments with relative timestamps
- [ ] End of day summary banner (appears after 5pm, tasks due today, "Move open to tomorrow")
- [ ] Completion streak on dashboard (compute from `activity_log`, no extra table)

## Key specs

**My Day (`my_day` table):**
- Tasks added manually by user — does not change project/status/due date
- Clears at midnight via `date` column
- Yesterday's overdue tasks surfaced at top with "carry over?" prompt
- Completion count at top: "5 of 8 done today"

**Eisenhower matrix:**
- Urgent+Important / Not Urgent+Important / Urgent+Not Important / Not Urgent+Not Important
- Auto-plot: urgent/high priority + due ≤3 days = Urgent axis
- Each quadrant scrolls independently
- Drag between quadrants updates priority

**End of day summary:**
- Dismissible banner after 5pm (time configurable in workspace settings)
- "{N} tasks completed today · {M} still open"
- "Move open tasks to tomorrow" bulk reschedules
- Dismissed state in `localStorage` per day

## Tests to write (Phase 4)

**`lib/time.test.ts`:**
- `formatDuration(90)` → `"1h 30m"`
- `formatDuration(0)` → `"0m"`
- `formatDuration(60)` → `"1h"`
- `calculateDuration(startedAt, endedAt)` returns correct minutes
- Detects overlapping time entries for same task

**`components/task/TimeTracker.test.tsx`:**
- Start button shows running timer
- Timer increments every second (`vi.useFakeTimers()`)
- Stop calls `createTimeEntry` with correct duration
- Manual entry submits correct payload
- Total logged time sums all entries

## Coverage target after Phase 4
Lines ≥ 80% · Functions ≥ 80% · Branches ≥ 75%
