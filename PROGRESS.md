# Lodestar — Progress

## Current phase
Phase 3 — AI Features (in progress)

## Completed
- Pre-build setup: Supabase (18 tables, RLS, triggers, constraints all verified), Google OAuth, Anthropic API, Upstash Redis
- Next.js scaffold with full dependency stack (Tailwind, shadcn/ui, dnd-kit, Chart.js, Vitest, RTL)
- `lib/types.ts` — all TypeScript interfaces for every DB table + AppError, FilterState, TaskWithRelations
- `lib/utils.ts` — cn() helper (6 tests, 100% coverage)
- `lib/supabase/client.ts` — browser Supabase client
- `lib/supabase/server.ts` — SSR Supabase client (cookie-based)
- `lib/supabase/route-handler.ts` — route handler client (writes session cookies onto NextResponse)
- `lib/supabase/admin.ts` — service role client (bypasses RLS for workspace bootstrapping)
- `middleware.ts` — session refresh, expired-session detection (?reason=expired), route protection, /reset-password excluded from auth redirect
- `tests/mocks/supabase.ts` — shared Supabase mock (single source of truth)
- `tests/mocks/anthropic.ts` — shared Anthropic mock with success + error helpers
- `tests/lib/utils.test.ts` — 6 tests, all passing
- `.claude/rules/testing.md` — full testing discipline rules added
- `app/globals.css` — full Lodestar design system (cerulean + steel palette, CSS vars, auth-input/btn-primary/btn-secondary component classes)
- `app/layout.tsx` — Inter + JetBrains Mono fonts, lodestar metadata
- `lib/auth.ts` — 7 auth helpers (signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, sendPasswordReset, updatePassword, resendVerificationEmail)
- `tests/lib/auth.test.ts` — 14 tests covering all auth helpers, happy path + failure path each
- `app/(auth)/layout.tsx` — centered auth shell (steel-50 bg)
- `app/(auth)/callback/route.ts` — OAuth code exchange, first-login workspace creation, next= redirect for password reset
- `tests/api/callback.test.ts` — 7 tests covering all callback paths
- `app/(auth)/login/page.tsx` — email + password + Google OAuth, expired-session banner, unverified-email resend link
- `app/(auth)/signup/page.tsx` — email + password + confirm + Google OAuth, redirects to /verify-email
- `app/(auth)/verify-email/page.tsx` — resend with 60s countdown, "Wrong email? Go back"
- `app/(auth)/forgot-password/page.tsx` — always shows generic message (no email leak)
- `app/(auth)/reset-password/page.tsx` — new + confirm password, success → /login after 2s, expired-token message + link
- **Google OAuth fully working** — both email/password and Google OAuth land at /dashboard correctly
- `app/not-found.tsx` — 404 page (dark bg, cerulean accent, link to /dashboard)
- `app/error.tsx` — top-level error boundary ('use client', reset() + /dashboard link)
- `app/(app)/error.tsx` — in-shell error boundary (renders within sidebar/topbar layout)
- `app/(app)/matrix/page.tsx` — "coming soon" placeholder (fixes broken sidebar nav link)
- `app/(app)/projects/page.tsx` — real projects list: color-bordered cards, Open links, New project dialog with name + 6 preset color swatches, optimistic via useProjects().addProject
- `app/(app)/settings/page.tsx` — server redirect to /settings/profile (fixes broken BottomNav link)
- `tests/components/projects/ProjectsPage.test.tsx` — 6 tests: card render, empty state, loading state, dialog open, addProject called with name+color, color swatch selection
- `UndoItem` interface extended with `message?: string` and `undo?: () => void` (optional) — supports pure info toasts
- `components/ui/Toast.tsx` — fixed bottom-right overlay, one toast per undoStack item, Undo action + × close, 5s auto-dismiss, slide-up+fade entrance animation
- `tests/components/ui/Toast.test.tsx` — 6 tests: empty stack renders nothing, item renders toast, message overrides label, × dismisses, Undo calls fn + dismisses, auto-dismiss at 5000ms
- `app/(app)/settings/layout.tsx` — two-column settings layout: 200px dark left nav (Profile/Account/Workspace) with cerulean active state; mobile collapses to horizontal tab strip above content
- `tests/components/settings/SettingsLayout.test.tsx` — 6 tests: three nav links render, active class per path (profile/account/workspace), children in content area, mobile nav links
- `lib/context/AuthContext.tsx` — added `updateProfile(updates: Partial<Profile>)` to context interface and provider for out-of-context profile state updates
- `lib/profile.ts` — `updateDisplayName`, `updateAvatar`, `uploadAvatar` (compresses to 256×256 via browser-image-compression, uploads to Supabase Storage `avatars` bucket, returns public URL)
- `tests/lib/profile.test.ts` — 6 tests: updateDisplayName happy path + error, updateAvatar happy path + error, uploadAvatar success + storage error
- `app/(app)/settings/profile/page.tsx` — avatar section (initials fallback, file input, loading overlay, optimistic update + revert on failure), display name section (pre-filled, 1–50 char validation, inline "Saved" feedback, optimistic update + revert)
- `tests/components/settings/ProfileSettingsPage.test.tsx` — 9 tests: pre-filled input, empty-name validation, valid save calls updateDisplayName, "Saved" feedback, revert on name error, file triggers uploadAvatar+updateAvatar, revert on avatar error, initials fallback, img when avatar set
- `updateEmail` and `deleteAccount` added to `lib/auth.ts` — updateEmail calls supabase.auth.updateUser; deleteAccount POSTs to /api/auth/delete-account (never calls admin API client-side)
- `app/api/auth/delete-account/route.ts` — POST handler: getUser() → 401 if no session; adminClient.auth.admin.deleteUser → 200 on success, 500 on failure
- `app/(app)/settings/account/page.tsx` — email section (read-only + inline change form, sends confirmation, never reveals whether email is registered), password section (Change password / Set a password for Google-only accounts), danger zone (delete dialog with "delete" confirmation input)
- `app/(auth)/login/page.tsx` — ?deleted=true shows "Your account has been deleted." banner (reuses expired-session banner style)
- `tests/lib/auth.test.ts` — added 4 tests: updateEmail happy path + error, deleteAccount happy path + non-ok response
- `tests/api/delete-account.test.ts` — 3 tests: no session → 401, valid session → admin.deleteUser called → 200, admin delete fails → 500
- `tests/components/settings/AccountSettingsPage.test.tsx` — 6 tests: renders email, send confirmation calls updateEmail, change password calls sendPasswordReset, Google-only shows "Set a password", confirm button disabled until "delete" typed, confirm calls deleteAccount+signOut+redirect
- `lib/workspace.ts` — `updateWorkspace(id, updates)` — patches workspaces row, returns full updated row
- `tests/lib/workspace.test.ts` — 3 tests: correct args + returns row, multiple fields, throws on error
- `lib/context/AuthContext.tsx` — added `setWorkspace: (ws: Workspace) => void` to context interface and provider (optimistic workspace updates)
- `app/(app)/settings/workspace/page.tsx` — owner: name (1–60 chars + save), color (6 cerulean/steel swatches + custom hex), timezone (select, ~20 IANA zones), end-of-day (time input, saves on blur); non-owner: read-only view; all saves optimistic with toast revert on failure
- `tests/components/settings/WorkspaceSettingsPage.test.tsx` — 5 tests: renders name, non-owner read-only, save name calls updateWorkspace, color swatch calls updateWorkspace, timezone select calls updateWorkspace + revert on failure
- `lib/keyboard.ts` — `KeyboardManager` class + `keyboard` singleton; `register()` returns unregister fn; listener skips inputs/textareas/contenteditable; `mount()`/`unmount()` control window listener; `getAll()` for ? reference sheet
- `tests/lib/keyboard.test.ts` — 5 tests: unregister removes shortcut, handler called for matching key, ignored on input, ignored on textarea, getAll returns all shortcuts
- `components/ui/QuickCapture.tsx` — floating modal, auto-focus, Q shortcut via keyboard singleton, Enter creates task via addTask, Escape/backdrop closes without creating
- `tests/components/ui/QuickCapture.test.tsx` — 4 tests: hidden initially, q keydown opens modal, Enter calls addTask + closes, Escape closes without addTask
- `app/(app)/layout.tsx` — added `<QuickCapture />` inside UIProvider
- **Phase 2 foundation (PROMPT 0)** — app shell, contexts (`AuthContext`, `ProjectsContext`, `TasksContext`, `UIContext`), data helpers (`lib/projects.ts`, `lib/tasks.ts`), layout components (`Sidebar`, `BottomNav`, `Topbar`), `app/providers.tsx`, `app/(app)/dashboard/page.tsx`, `lib/supabase/admin.ts`, `lib/supabase/route-handler.ts`, and all tests — validated: type-check PASS, 182 tests PASS, coverage 93.35% lines / 88.28% functions / 83.26% branches (Phase 2 thresholds exceeded), build PASS
- **TaskForm** — `components/tasks/TaskForm.tsx` — Dialog-based modal for creating and editing tasks; title/description/priority button group/due date/project select/est. mins; inline title validation; spinner + disabled state on submit; form resets on re-open via key; 6 tests all passing, type-check clean
- **TaskRow** — `components/tasks/TaskRow.tsx` — single task row for list views; drag handle (hover-only on desktop, always on mobile), checkbox circle, 8px priority dot, truncated title with inline edit (click→input, blur saves via onEdit), due date badge (overdue = red), three-dot DropdownMenu (Edit/Archive/Delete); 8 tests all passing, type-check clean
- **Undo toast integration** — `UndoItem.canUndo?: boolean` added; Toast hides Undo button when `canUndo === false`; TaskRow archive pushes undoable toast (undo restores via editTask), delete pushes confirmation-only toast (`canUndo: false`); 11 new tests added (199 total), type-check clean
- **TaskList** — `components/tasks/TaskList.tsx` — virtualized (@tanstack/react-virtual, estimateSize 48px) + draggable (@dnd-kit, PointerSensor, activationConstraint delay 250ms) list; SortableRow wraps TaskRow with useSortable attrs/listeners as dragHandleProps; handleDragEnd computes fractional position via arrayMove + getFractionalPosition and calls onReorder; empty state shows emptyMessage or "No tasks"; 5 tests all passing, type-check clean
- **Inbox page** — `app/(app)/inbox/page.tsx` — page header (heading + cerulean count badge + "New task" button), quick-capture bar (Enter creates task with project_id=null, clears input), TaskList filtered to project_id===null && !is_archived, TaskDetail placeholder panel (slide-in right, shows title + description), TaskForm dialog (create via "New task" or "Edit" three-dot menu); 5 tests all passing, type-check clean
- **Dashboard stats** — `app/(app)/dashboard/page.tsx` — converted to 'use client'; real stats via useTasks(): due today, overdue, completed this week, in progress
- **My Day page** — `app/(app)/my-day/page.tsx` — page header (heading + date + cerulean count badge + "New task" button), "Due today" section (tasks where due_date === today's YYYY-MM-DD), "Added to My Day" section (locally pinned tasks, hidden when empty), empty state when both sections empty; TaskRow/TaskList extended with optional `onAddToMyDay`/`onRemoveFromMyDay` props; clicking "Add to My Day" moves task from "Due today" to "Added to My Day"; TaskForm pre-sets due_date to today on create; 5 tests all passing, type-check clean
- **Drag reorder bug fixes** — two bugs resolved in `TaskList` + `TasksContext`:
  - `editTask` now re-sorts the tasks array by position when a position update is included — fixes reorder not persisting visually after drop
  - `TaskList` refactored to use `DragOverlay` + local `ordered` state + `isDragActive` flag — dragged item renders as invisible placeholder, overlay follows cursor, transition suppressed on drop to prevent competing animations with the virtualizer's absolute positioning; eliminates snap-back-then-animate glitch on release

- **TaskDetail panel** — `components/tasks/TaskDetail.tsx` — slide-in detail panel (400px desktop, full-screen mobile); inline-editable title (click→input, blur saves), status dropdown, priority 4-button group, due date, project select, description textarea, estimated minutes; Archive + Delete (with confirmation) header buttons; four stub sections (Subtasks/Labels/Dependencies/Activity); Escape + backdrop close; auto-closes when task disappears from context; 7 tests all passing, type-check clean
- **TaskDetail wired into app** — `<TaskDetail />` mounted globally in `app/(app)/layout.tsx`; `TaskRow` title click calls `openDetail(task.id)` (inline-title editing removed from TaskRow — editing lives in TaskDetail); Inbox placeholder panel removed
- **TaskDetail animations** — slide-in on open (`@keyframes` CSS, GPU transform, zero layout cost); slide-out on close (200ms `setTimeout` matches CSS duration); backdrop fades in/out at `bg-black/40`; `closeTimerRef` cancels pending close when a new task opens — fixes stale `isClosing` persisting across open/close cycles (component stays mounted in layout tree, never truly unmounts)
- **Subtasks** — `lib/subtasks.ts` (getSubtasks, createSubtask, toggleSubtask); `components/tasks/SubtaskList.tsx` (progress bar, checkbox toggle with optimistic UI + rollback, inline add-subtask input); wired into TaskDetail replacing stub; 12 new tests (8 lib + 4 component), all passing
- **Labels** — `lib/labels.ts` (getLabels, createLabel, updateLabel, deleteLabel, getTaskLabels, addLabelToTask, removeLabelFromTask); `components/tasks/LabelPicker.tsx` (popover trigger showing current label pills, checkbox list with optimistic add/remove + rollback, inline "New label" form with 6 color swatches); wired into TaskDetail replacing stub; 18 new tests (14 lib + 4 component), all passing
- **FilterBar** — `components/filters/FilterBar.tsx` — horizontal filter bar with search input (× clear), "Filter" dropdown (priority + status checkboxes), "Due date" dropdown (Today/This week/Overdue, dynamically computed), "Label" dropdown (loads via getLabels, checkbox list), active filter chips (each with × to remove), "Clear all" button; wired into Inbox and My Day pages above TaskList, consuming `filters`/`setFilters` from TasksContext; 6 tests all passing, type-check clean
- **BoardView** — `components/views/BoardView.tsx` — Kanban board with three columns (To do / In progress / Done); dnd-kit cross-column and within-column drag with PointerSensor (delay 250ms, tolerance 5), DragOverlay ghost card, optimistic move with rollback on failure; column headers show count badge; "+ Add task" button per column; cards show priority left-border (design colors), title (2-line clamp), priority dot, overdue due date badge, three-dot menu (Edit/Archive/Delete); archived tasks excluded; 9 tests all passing
- **Project page** — `app/(app)/projects/[id]/page.tsx` — reads project id from params, sets `activeProject` in ProjectsContext (clears on unmount), renders FilterBar + BoardView or TaskList (list view) based on `UIContext.activeView`, view toggle buttons (list/board icons) in page header; project color dot + name + task count badge

- **ListView** — `components/views/ListView.tsx` — sortable table (Priority/Title/Status/Due Date column headers, click to sort asc, click again desc); inline status and priority editing via `<select>` on cell click; inline title editing on click with blur-save via `editTask`; row checkboxes + select-all tracked in local `Set<string>`; bulk action bar ("Archive N tasks") calls `onBulkArchive` and clears selection; uses `sortTasks` from `lib/tasks.ts`; wired into project page (replaces TaskList in list branch), Inbox, and My Day (both get a list/table toggle button in the page header); 7 tests all passing

- **Project persistence fix** — `lib/context/ProjectsContext.tsx` + `lib/tasks.ts`: switched TasksContext from `getTasks` (project-scoped) to `getAllTasks` (workspace-wide fetch, no project filter); removed `activeProject` from TasksContext useEffect deps so navigating away no longer clears tasks; ProjectsContext now wraps `setActiveProject` to write `lodestar:lastProjectId` to localStorage on every project select and restores it on workspace load; removed `setActiveProject(null)` cleanup from project page unmount — tasks stay loaded across navigation

- **Drag-and-drop fixes (TaskList + BoardView)** — replaced `PointerSensor` (delay: 250ms) with `MouseSensor` (activationConstraint: distance 5px) + `TouchSensor` (delay: 250ms) in both `TaskList.tsx` and `BoardView.tsx`; mouse drag now activates after 5px movement (instant feel) while touch retains 250ms hold to distinguish drag from scroll; also fixed `dragHandleProps` in `TaskList` to spread only `listeners` onto the drag handle and `attributes` onto the container div — previously spreading both caused `role="button"` to land on the drag handle span

- **Task dependencies & linked tasks** — `lib/dependencies.ts` (getDependencies, addDependency, removeDependency), `lib/links.ts` (getLinkedTasks, addLink, removeLink — bidirectional via OR query); `components/tasks/TaskDependencies.tsx` — "Blocked by" section with status badge + optimistic remove, "Blocking" section (read-only), "Related tasks" section with optimistic add/remove, controlled `<select>` pickers; wired into TaskDetail.tsx replacing "Dependencies — coming soon" stub; 7 component tests (including 2 optimistic rollback paths) + 8 lib tests = 15 new tests (299 total), type-check clean, build clean

- **Due date quick pick & snooze** — `components/tasks/DueDatePicker.tsx` (Popover with Today/Tomorrow/This Friday/Next Monday/In 2 weeks + custom date input + conditional Clear; all dates computed dynamically at render; display shows "Today"/"Tomorrow"/weekday name/formatted month+day); `components/tasks/SnoozeMenu.tsx` (IconAlarmSnooze Popover with +3 hours UTC/tomorrow morning/this weekend/next week/pick datetime; relative snooze uses UTC ISO string, fixed times use local ISO string without Z); both integrated into TaskDetail.tsx (DueDatePicker replaces plain date input, SnoozeMenu in header); 10 new tests (7 DueDatePicker + 3 SnoozeMenu), all using vi.useFakeTimers() at noon UTC to avoid timezone off-by-one; 309 tests total, type-check clean

- **UX redesign (naming + task-project enforcement)** — end-to-end restructuring of how tasks relate to projects and how navigation surfaces them:
  - `Inbox` → `Tasks` rename: Sidebar nav (label + icon `IconChecklist` + href `/tasks`), BottomNav (same), old `inbox/page.tsx` now server-redirects to `/tasks`
  - Created `app/(app)/tasks/page.tsx` — shows ALL non-archived workspace tasks (no project filter), BoardView default, view toggle, "New task" button disabled when no active project, new tasks auto-assigned to `activeProject.id`
  - No task can be created outside a project — TaskForm gains `showProjectSelector?: boolean` prop; project field is always visible in edit mode; in create mode the field is hidden (caller passes active project implicitly) unless `showProjectSelector={true}` (projects list page only), where it becomes a required field with asterisk and inline validation
  - `/projects/page.tsx` — each card is now a full-width `<Link>` (chevron icon replaces "Open" button); clicking anywhere enters the board directly
  - `ProjectSwitcher` — added "View all projects" link (with `IconFolders`)
  - `Sidebar` — ProjectSwitcher container gets cerulean left-border + background highlight when `pathname.startsWith('/projects/')`
  - `my-day/page.tsx` — new tasks created with `project_id: activeProject?.id ?? null`
  - `QuickCapture` — uses `activeProject?.id` for `project_id`; when on `/projects` route shows inline required project `<select>` dropdown
  - `BoardView` — `onAddTask` now optional (`onAddTask?: ...`) so Tasks page (no specific project context) can hide the column-level "Add task" button
  - 11 test files updated; 1 new test file (`TasksPage.test.tsx`); total 310 tests, type-check clean, build clean

- **Edit menus → TaskDetail + priority color coding** — unified all task editing surfaces through TaskDetail (the full slide-in panel):
  - `TaskRow`, `ListView` (CardUI in BoardView), all three-dot "Edit" dropdown items now call `openDetail(task.id)` instead of opening TaskForm
  - `onEdit` prop removed from `TaskRow`, `TaskList`, `ListView`, `BoardView` entirely — pages no longer manage editing state
  - `BoardView` cards are now clickable (whole card calls `openDetail`); three-dot trigger uses `e.stopPropagation()`; DragOverlay ghost card has `clickable={false}` to prevent phantom opens during drag
  - All page handlers simplified: `editingTask` state, `handleEdit` function, and TaskForm `initialValues` editing logic removed from My Day, Tasks, and Projects pages
  - My Day inline detail panel removed (TaskDetail is global in layout)
  - `TaskDetail` priority buttons redesigned — all four options always show tinted background + colored text + tinted border (urgent/red, high/amber, medium/cerulean, low/steel); selected button gets stronger border color + `fontWeight: 600` + outer ring shadow
  - 7 test files updated (TaskRow, TaskList, BoardView, ListView all drop `onEdit`; BoardView/ListView get `useUI` mock for `openDetail`); 310 tests, type-check clean, build clean

- **Unified task creation via TaskDetail + QuickCapture defaults** — removed TaskForm from all page-level creation flows; all task creation now opens the TaskDetail slide-in panel in create mode:
  - `UIContext` gains `isCreating` (bool), `createDefaults` (`{ project_id?, due_date? }`), and `openCreate(defaults?)` — sentinel `'__create__'` stored in `detailTaskId`
  - `TaskDetail` extended with create mode: title input (auto-focus), status select, priority buttons, DueDatePicker, project select, description, estimated mins, "Create task" button; header shows "New task" label + × in create mode; Archive/Delete buttons moved to left side of header in edit mode (away from the × close button)
  - `QuickCapture` rewritten — no inline form; Q shortcut calls `openCreate({ project_id: activeProject?.id ?? null, due_date: today })` via `useRef` to avoid stale closure on project change
  - `my-day/page.tsx`, `tasks/page.tsx`, `projects/[id]/page.tsx` all cleaned up: TaskForm removed, `openCreate` wired to "New task" buttons and board column buttons
  - 6 test files updated (UIContext, TaskDetail, QuickCapture, TasksPage, MyDayPage, two settings pages); 314 tests total, type-check clean, build clean

- **TaskDetail header redesign (session 2026-05-15)** — made destructive actions harder to accidentally trigger:
  - Snooze icon moved to far left of header in edit mode
  - Archive + Delete removed as individual header buttons; nested inside a gear (⚙ `IconSettings`) dropdown to the right of snooze
  - Delete from the gear dropdown sets `confirmDelete=true` and closes the dropdown; a red confirmation strip renders below the header ("Delete this task permanently? | Cancel | Delete") requiring an explicit second click — prevents one-click accidental delete
  - Header layout: `[⏰ Snooze] [⚙ Gear] ──── flex-1 ──── [×]` (edit mode) / `[New task label] ──── flex-1 ──── [×]` (create mode)
  - Tests updated: archive/delete now interact with the dropdown and confirmation strip; 314 tests, type-check clean, build clean

- **Subtasks excluded from top-level task lists** — added `&& t.parent_id === null` filter in Tasks page, My Day (both due-today and pinned), and Projects board/list; subtasks now only appear inside their parent's TaskDetail panel

- **Dashboard overdue/due-today timezone fix** — `new Date().toISOString().split('T')[0]` returns UTC date, which is tomorrow's date in timezones ahead of UTC, making tasks due today appear overdue; switched to local-date string built from `getFullYear()`/`getMonth()`/`getDate()`, matching the approach already used in `TaskRow.isOverdue` and `BoardView.isOverdue`

- **Keyboard reference sheet** — `components/ui/KeyboardReferenceSheet.tsx`; Dialog opens on `?` keypress, two-column list of all `keyboard.getAll()` entries (key badge + description), closes on Escape or ×; mounted in `app/(app)/layout.tsx` alongside QuickCapture; 4 tests all passing
- **Keyboard shortcuts expanded** — `lib/keyboard.ts` extended with chord support (`chord?` field, 1500ms timeout, clears on unmount); `components/ui/AppShortcuts.tsx` registers G→D/M/T (navigation), B/L (view toggle), / (focus search); `components/tasks/TaskDetail.tsx` registers 1–4 (priority) when a task is open; `components/filters/FilterBar.tsx` gets `data-search-input` attribute; `KeyboardReferenceSheet` renders chord keys as separate badges; 16 new tests (8 keyboard, 7 AppShortcuts, 5 TaskDetail priority); 334 total

## Session 2026-05-15 end-of-session checklist (session 5)
- type-check: **PASS** (0 errors)
- tests: **PASS** (334 tests, 44 files)
- coverage: **81.74% statements / 84.86% lines / 74.42% branches / 74.94% functions** (all above Phase 1 config thresholds 70/70/65; functions 74.94% just under Phase 2 target of 75% — not raising config yet)
- build: **PASS**

- **Bulk board actions & search correctness** —
  - `getTasksBySearch` added to `lib/tasks.ts`: `.ilike('title', '%term%')` workspace-wide, returns `[]` on error
  - `ilike` added to `tests/mocks/supabase.ts`
  - `TasksContext` refactored: internal `allTasks` + `searchOverride: Task[] | null` state; debounced (300ms) effect on `filters.search` calls `getTasksBySearch` and replaces displayed list; clears override when search is empty; mutations keep both states in sync with rollback support
  - `BoardView` extended: `selectedIds: Set<string>` + `lastClickedId` state; single click selects/deselects; double-click opens TaskDetail; shift-click in same column selects range, across columns selects both endpoints only; bulk action bar (fixed bottom, `data-testid="bulk-action-bar"`) shows when any cards selected — Move to / Set priority / Archive / Clear; new props `onBulkMove`, `onBulkSetPriority`, `onBulkArchive` (all optional); `CardUI` gains `data-testid="card-{id}"` and `aria-selected`
  - Project page wired: `onBulkMove` / `onBulkSetPriority` / `onBulkArchive` call `editTask` / `archiveTask` sequentially
  - 9 new tests (2 `getTasksBySearch` lib tests + 7 BoardView bulk-selection tests); 343 total; type-check clean

## Session 2026-05-15 end-of-session checklist (session 6)
- type-check: **PASS** (0 errors)
- tests: **PASS** (343 tests, 44 files)
- coverage: **80.93% statements / 84.13% lines / 73.89% branches / 74.06% functions** (all above Phase 1 config thresholds 70/70/65; lines/statements/branches above Phase 2 targets; functions 74.06% just under Phase 2 target of 75% — not raising config yet)
- build: **PASS** (warnings only — all pre-existing: `<img>` in profile/page.tsx, `_userId` unused in auth.ts, `_taskId` unused in SnoozeMenu.tsx, useEffect missing deps in TaskDetail.tsx, unused expression in ListView.tsx)

- **Saved filters** —
  - `lib/saved-filters.ts` — `getSavedFilters(workspaceId, userId)`, `createSavedFilter(workspaceId, userId, name, filters)`, `deleteSavedFilter(id)`; all query the `saved_filters` table (RLS: personal, per user_id)
  - `FilterBar` extended with optional `userId` prop; when provided: "Saved" bookmark-icon button renders; popover shows "Save current filters" name input (only when filters are active) + list of saved filters (apply on click, delete with trash icon); saving optimistically adds to list, deleting optimistically removes then re-fetches on failure
  - Tasks page, My Day page, and Projects page all updated to pass `userId={user?.id}` to FilterBar
  - `tests/lib/saved-filters.test.ts` — 8 tests covering getSavedFilters (happy + empty + error), createSavedFilter (happy + error), deleteSavedFilter (happy + error)
  - `tests/components/filters/FilterBar.test.tsx` — 6 new tests: Saved button absent without userId, present with userId, empty state, save input visible when filters active, saving calls createSavedFilter + shows result, applying a saved filter calls onChange, deleting calls deleteSavedFilter + removes from list; total 12 FilterBar tests
  - 14 new tests; 357 total; type-check clean, build clean

## Session 2026-05-15 end-of-session checklist (session 7)
- type-check: **PASS** (0 errors)
- tests: **PASS** (357 tests, 45 files)
- coverage: **81.24% statements / 84.48% lines / 74.41% branches / 74.49% functions** (all above Phase 1 config thresholds 70/70/65; lines/statements/branches above Phase 2 targets; functions 74.49% just under Phase 2 target of 75% — not raising config yet)
- build: **PASS** (warnings only — all pre-existing)

- **Comments + activity feed (relative timestamps)** —
  - `lib/relative-time.ts` — `relativeTime(date, now?)`: pure function; "just now" (<1min), "X minutes ago", "X hours ago", "yesterday", "X days ago" (≤7), then formatted date (>7 days); `now` param for testability
  - `lib/comments.ts` — `getComments(taskId)`, `addComment(workspaceId, taskId, userId, body)`, `deleteComment(id)`; two-step approach: fetch comment rows, then batch-fetch profiles via `.in('id', userIds)` and join in app code; `Comment` type with `profile` field; `deleteComment` by id
  - `components/tasks/CommentThread.tsx` — loads comments on mount, renders avatar (initials fallback) + display_name + relativeTime + body; own comments show delete button (optimistic remove + re-fetch on error); textarea submit via button or Ctrl+Enter; optimistic append with rollback on failure
  - Wired into `TaskDetail.tsx` replacing "Activity — coming soon" stub; `useAuth()` added to TaskDetail to get `user.id`; CommentThread mocked in TaskDetail test
  - `tests/mocks/supabase.ts` — added `.in()` method to shared mock
  - `tests/lib/relative-time.test.ts` — 16 tests covering all time buckets with injected `now` param AND fake timers
  - `tests/lib/comments.test.ts` — 8 tests: getComments (happy + missing profile fallback + empty + error), addComment (happy + error), deleteComment (happy + error)
  - `tests/components/tasks/CommentThread.test.tsx` — 5 tests: renders comments with name+body, relativeTime shown, delete only on own, delete calls handler + optimistic remove, submit calls addComment + clears input, reverts on error
  - 31 new tests; 388 total; type-check clean, build clean

## Session 2026-05-15 end-of-session checklist (session 8)
- type-check: **PASS** (0 errors)
- tests: **PASS** (388 tests, 48 files)
- coverage: **81.91% statements / 84.97% lines / 74.55% branches / 75.23% functions** (all above Phase 1 config thresholds 70/70/65; all Phase 2 targets met — lines ≥75% ✓, functions ≥75% ✓, branches ≥70% ✓)
- build: **PASS** (warnings only — all pre-existing)

- **Loading & responsiveness overhaul (session 2026-05-16)** — UX-first loading pass across the entire app:
  - `components/ui/ViewSkeleton.tsx` — 8 shimmer task rows (priority dot + title bar + date pill) using design system CSS vars; shown by Tasks, My Day, and Projects pages while `TasksContext.loading === true`
  - `app/(app)/loading.tsx` — Next.js route-segment Suspense skeleton (header + filter bar + rows)
  - `components/ui/NavigationProgress.tsx` — cerulean `var(--accent)` top bar with glow; intercepts `<a>` clicks immediately, crawls to 85%, completes when `usePathname` changes; moved to `app/providers.tsx` (root level) so it covers auth pages too
  - `components/layout/AppShell.tsx` — client wrapper that gates all shell chrome behind `authLoading`; renders `ShellSkeleton` (pixel-accurate dark sidebar + topbar + content rows) until auth resolves — eliminates project/profile flash on hard refresh
  - `AuthContext.signOut` — sets `loading=true` as first statement so `ShellSkeleton` shows on logout click before Supabase resolves
  - Login + signup Google buttons — `setLoading(true)` before `signInWithGoogle()`; button shows "Redirecting…" and disables immediately
  - `ProjectSwitcher` — converted all `router.push` buttons to `<Link>` (project list items + "View all projects"); triggers nav progress bar automatically; "New project" button calls `openProjectCreate()` from UIContext
  - `CreateProjectDialog` — extracted from `ProjectSwitcher` into standalone global component mounted in `AppShell`; controlled via `UIContext.projectCreateOpen / openProjectCreate / closeProjectCreate`
  - `Sidebar` — hides Tasks / My Day / Matrix when `projects.length === 0`; only Dashboard visible until first project is created. Settings link pinned to bottom with `IconSettings`, active state on `/settings/*`
  - My Day "New task" — `disabled={!activeProject}` + tooltip, matching Tasks page
  - `QuickCapture` (Q shortcut) — opens `CreateProjectDialog` when `projects.length === 0`; opens task create otherwise
  - `Topbar` Settings dropdown item converted to `<Link asChild>` for nav progress
  - `KeyboardManager` — `e.preventDefault()` added to direct shortcut matches (was already on chord matches); prevents shortcut characters from typing into auto-focused dialog inputs
  - CLAUDE.md updated with "Loading & responsiveness" section: rules for nav links, page/data loading, buttons/forms, logout, keyboard shortcuts, and a pre-ship checklist

## Session 2026-05-16 end-of-session checklist (session 9)
- type-check: **PASS** (0 errors)
- tests: **PASS** (388 tests, 48 files)
- coverage: **80.81% statements / 83.78% lines / 73.67% branches / 73.92% functions** (all above Phase 1 config thresholds 70/70/65; lines/statements/branches above Phase 2 targets; functions 73.92% just under Phase 2 target of 75% — not raising config yet)
- build: **PASS** (warnings only — all pre-existing)

- **Mobile input zoom fix** — `app/globals.css`: added `@media (max-width: 767px) { input, textarea, select { font-size: 16px !important } }` — prevents iOS Safari auto-zoom on focus for all form elements app-wide (browser zooms when font-size < 16px); also bumped `.auth-input` from 14px → 16px for consistency on desktop

- **Project dropdown enforced in create task** — `components/tasks/TaskDetail.tsx`: removed "No project" fallback option; create mode now auto-selects `createDefaults?.project_id ?? projects[0]?.id ?? null`; `handleCreate` guards on `!draftProjectId`; submit button also disabled when no project; `onChange` no longer passes `|| null` since the select always has a valid value

- **Topbar view title complete** — `components/layout/Topbar.tsx`: added `/tasks`, `/settings`, `/projects` to `VIEW_LABELS`; added `useProjects` hook to resolve project name on `/projects/[id]` routes (shows actual project name instead of "Projects"); `Topbar.test.tsx` updated with `useProjects` mock; topbar now never shows "lodestar" as a fallback in any real app route

- **Create task → full edit panel** — `TasksContext.addTask` now returns `Promise<string | null>` (the real DB task ID); `handleCreate` in `TaskDetail` calls `openDetail(newId)` instead of `handleClose()` — panel transitions seamlessly from create form to full edit mode with Subtasks, Labels, Dependencies, and Activity sections live immediately after save

## Session 2026-05-16 end-of-session checklist (session 10)
- type-check: **PASS** (0 errors)
- tests: **PASS** (388 tests, 48 files)
- coverage: **80.79% statements / 83.73% lines / 73.73% branches / 73.78% functions** (all above Phase 1 config thresholds 70/70/65; lines/statements/branches above Phase 2 targets; functions 73.78% just under Phase 2 target of 75% — not raising config yet)
- build: **PASS** (warnings only — all pre-existing)

- **Label filter AND logic** — `filterTasks` label check changed from `.some()` (OR — show task if it has any selected label) to `.every()` (AND — show task only if it has all selected labels); added a new test covering multi-label AND behavior using the `taskLabelIds` map

## Session 2026-05-16 end-of-session checklist (session 11)
- type-check: **PASS** (0 errors)
- tests: **PASS** (390 tests, 48 files)
- coverage: **79.66% statements / 82.78% lines / 71.86% branches / 72.00% functions** (all above Phase 1 config thresholds 70/70/65; lines/statements/branches above Phase 2 targets; functions 72.00% just under Phase 2 target of 75% — not raising config yet)
- build: **PASS** (warnings only — all pre-existing)

## In progress
None — Phase 2 complete. Ready to begin Phase 3.

## Next task
Phase 3 opening items (read `.claude/phases/3-ai.md` first):
- `lib/ai/tasks.ts` — AI function implementations: `createTaskFromPrompt`, `breakdownTask`, `suggestPriorities`, `extractDueDate`
- `/api/ai/create-task` route — natural language task creation with preview card + confirm
- `/api/ai/breakdown` route — task breakdown into 3–6 subtasks
- `components/ai/AICommandBar.tsx` — AI command bar UI
- `components/ai/AITaskBreakdown.tsx` — subtask suggestion UI

## Decisions made
- Using legacy Supabase JWT keys (eyJ...) — REST API requires JWT format, not new sb_publishable_ format
- "Automatically expose new tables" disabled — required running GRANT statements manually (see Known Issues)
- No LODESTAR-TESTING-PROMPT.md — .claude/rules/testing.md is auto-loaded and covers all testing discipline
- No co-author tags on commits
- `components/ui/**` excluded from coverage — shadcn library code, not application code
- Coverage thresholds set to Phase 1 values (70/70/65), will ratchet up after each phase
- `KeyboardManager` chord support uses a `chord?` field on `Shortcut`; the listener buffers the first key for 1500ms then clears — G-then-D fires "Go to Dashboard"; wrong second key clears pending chord without firing
- `AppShortcuts` component registers all global shortcuts (navigation chords, view toggle, search focus); priority shortcuts 1–4 live in `TaskDetail` since they only make sense when a task is open
- `data-search-input=""` HTML attribute on FilterBar's search input is the contract for the `/` focus-search shortcut — DOM query avoids prop drilling
- module-level `beforeEach`/`afterEach` outside a `describe` block causes "Vitest failed to find the runner" on Windows — all lifecycle hooks must be nested inside a `describe`
- Chord shortcuts display as two separate `<kbd>` badges in `KeyboardReferenceSheet` (e.g. `[G]` `[D]` not `[GD]`)
- Callback uses `next=` query param for routing after OAuth — clean separation between signup and password-reset flows
- `/reset-password` excluded from middleware's authenticated-user redirect — recovery session must reach the page
- `createRouteHandlerClient` pattern: build the redirect response FIRST, pass it to the client so `exchangeCodeForSession` writes session cookies directly onto the redirect response
- `createAdminClient` (service role) used for workspace/member bootstrapping — anon client's self-referential RLS blocks new users' first INSERT
- Downgraded Next.js 16 → 15 — Next.js 16 uses Turbopack by default causing OOM crashes; Next.js 15 uses Webpack by default
- `pool: 'forks'` in vitest.config.ts — prevents cross-file mock contamination on Windows
- `testTimeout: 15000` in vitest.config.ts — Windows full-suite parallelism starves `userEvent` tests which time out at the default 5000ms; increasing to 15s resolves it. `maxForks` is not a valid top-level option in Vitest 4's InlineConfig type (use `poolOptions.forks.maxForks` if needed, but deprecated; timeout alone is sufficient)
- FilterBar page tests mock `@/components/filters/FilterBar` as a null stub AND mock `@/lib/context/AuthContext` — both needed because wiring FilterBar into Inbox/My Day pages introduced `useAuth()` calls that page tests didn't previously need
- `editTask` in TasksContext re-sorts tasks by position when position is in the update payload — keeps context array order in sync with fractional position values without a separate fetch
- TaskList uses DragOverlay pattern for virtualizer + dnd-kit — dragged item is invisible placeholder, overlay floats at cursor, transition suppressed on drop; this is the canonical fix for the stacked-transform conflict between @tanstack/react-virtual absolute positioning and dnd-kit's settle animation
- All test mocks must use `mockResolvedValueOnce` (never bare `mockResolvedValue`) — permanent defaults survive `vi.clearAllMocks()` and leak across test files on Windows
- TasksContext reads `authLoading` from AuthContext before deciding to setLoading(false) — prevents loading flickering to false before auth resolves, which caused race conditions in tests and incorrect UX
- `workspace_members` RLS policy changed from self-referential to `user_id = auth.uid()` — the original policy caused PostgreSQL to detect recursion and return empty rows, making workspace permanently null in AuthContext (verified 2026-05-14)
- `TaskDetail` stays mounted in the layout tree (returns null, never unmounts) — `isClosing` state and close timers must be reset via a `detailTaskId` effect when a new task opens, otherwise the second task opened immediately closes
- CSS animation events (`onAnimationEnd`) are unreliable in jsdom — use `setTimeout` matching the animation duration + fake timers in tests instead
- `fireEvent` (synchronous) must be used instead of `userEvent` when fake timers are active — `userEvent` has internal async timers that deadlock with `vi.useFakeTimers()`
- Fake timer tests must use a nested `describe` with `beforeEach(() => vi.useFakeTimers())` + `afterEach(() => vi.useRealTimers())` — inline `vi.useRealTimers()` inside a test body does not run if the test times out, leaking fake timers into subsequent tests
- Supabase join results (`select('relation(col1, col2)')`) are inferred as an array by TypeScript — cast through `unknown` first: `(data as unknown as Row[])` where Row uses the scalar type for the join
- `removeLabelFromTask` uses two chained `.eq()` calls — tests must mock them separately: `mockSupabase.eq.mockReturnValueOnce(mockSupabase).mockResolvedValueOnce({ error: null })`
- Components that embed child components with their own lib calls (e.g. TaskDetail → LabelPicker) need those lib modules mocked in the parent's test file to prevent runtime noise from unresolved promise chains in jsdom
- Fake timer tests for date pickers must use noon UTC (`2024-01-15T12:00:00Z`) rather than midnight UTC (`2024-01-15`) — midnight UTC resolves to the previous calendar day in US timezones (UTC-5 to UTC-8), causing off-by-one in `getDate()`/`getDay()` calls
- `MouseSensor` (distance constraint) must be used for desktop drag; `TouchSensor` (delay constraint) for mobile — `PointerSensor` with `delay: 250` makes mouse drag require a 250ms dead-hold which nearly never activates in practice
- `dragHandleProps` on TaskRow should carry only dnd-kit `listeners` (event handlers), not `attributes` — `attributes` includes `role="button"` which, if placed on the handle span, can interfere with drag activation; `attributes` belongs on the sortable container div
- `getAllTasks` (workspace-wide, no project filter) is the right fetch for TasksContext — project filtering happens in-memory in each page; fetching all tasks once avoids stale-context issues when navigating between pages
- Every task must belong to a project — `showProjectSelector` prop on TaskForm is only passed when viewing `/projects` (required + asterisk); elsewhere the form uses `activeProject.id` silently; "New task" button is disabled when no active project
- `onAddTask` on `BoardView` is optional — Tasks page passes `undefined` (no project-specific context) to hide column-level "Add task" buttons; project board always passes it
- Fake timer `useEffect` deps: QuickCapture's open-effect now depends on `[open, onProjectsPage, activeProject]` — tests need `useProjects` mocked before rendering QuickCapture
- `openCreate` / `isCreating` / `createDefaults` added to `UIContext` — sentinel value `'__create__'` stored in `detailTaskId` triggers create mode; `isCreating` is computed (not stored) from the sentinel; `createDefaults` holds project_id + due_date pre-fills
- `TaskDetail` create mode uses separate draft state (not the live task fields) — initialized from `createDefaults` whenever `detailTaskId` changes; auto-close guard skips when `isCreating` since there is no real task to watch
- `useRef` in `QuickCapture` for `activeProject` — keyboard handler is registered once (stable `openCreate` dep), but must always read the latest project; ref avoids re-registering the shortcut on every project change
- Subtasks must be excluded at the filter layer (`parent_id === null`), not at the DB fetch layer — TasksContext fetches all tasks workspace-wide; each page is responsible for scoping its own list
- BoardView bulk selection uses `fireEvent` (not `userEvent`) in tests — synchronous, no async timer issues; `within(screen.getByTestId('bulk-action-bar'))` needed to disambiguate "Archive"/"Done" from column headers/dropdown items
- `searchOverride` in TasksContext is `Task[] | null` (null = not searching, array = search results); mutations update both `allTasks` and `searchOverride` when the latter is non-null; rollback restores both; `tasks` exposed from context is `searchOverride ?? allTasks`
- BoardView card click model: single click selects (adds to `selectedIds`); double click opens TaskDetail via `openDetail`; three-dot "Edit" also opens TaskDetail; drag still works (MouseSensor distance:5px means static clicks never activate drag)
- Date-only comparisons against `due_date` (YYYY-MM-DD strings) must use local date components, not `toISOString()` (UTC) — `toISOString()` can return tomorrow's date in timezones ahead of UTC, making today's tasks appear overdue
- Gear dropdown for Archive/Delete: delete confirmation uses a panel strip (not a second button state) because shadcn DropdownMenu closes on item click — the strip renders below the header and persists until Cancel or Confirm is clicked
- `saved_filters` RLS is personal (user_id = auth.uid()) not workspace-shared — intentional; saved filters are a personal productivity tool, not shared state
- `FilterBar` receives optional `userId` prop; when omitted (e.g. tests that don't need saved filters) the Saved button is hidden entirely — backwards-compatible
- `deleteSavedFilter` in FilterBar does an optimistic removal and re-fetches on failure (rather than rollback) — re-fetch is simpler since the list is short and the failure path is rare
- `profiles` join in `task_comments` queries does not work via PostgREST embedded resource syntax — `task_comments.user_id → auth.users.id ← profiles.id` is an indirect relationship PostgREST cannot traverse; use two-step app-code join: fetch comment rows, then `.in('id', userIds)` on profiles, merge in application code
- `screen.queryByText('Failing comment')` in RTL also matches textarea value when React sets it as controlled value in jsdom — use `{ selector: 'p' }` to restrict text search to paragraph elements, or check for empty-state sentinel text ("No comments yet.") to verify optimistic rollback instead
- `relativeTime` uses `Math.floor(diffMs / DAY)` for day comparison — 25 hours → diffDays=1 → "yesterday" (not "1 day ago"); this is the intended behavior matching the UX spec
- `NavigationProgress` is mounted in `app/providers.tsx` (root), not in `AppShell` — one instance covers all routes including auth pages; `AppShell` no longer needs to import it
- All internal nav must use `<Link>` not `router.push` — `router.push` bypasses `NavigationProgress`'s click listener; if `router.push` is unavoidable, call `startNavigationProgress()` first
- `AppShell` gates all shell chrome behind `authLoading` from `AuthContext`; `ShellSkeleton` must match real shell dimensions (240px sidebar, 46px topbar) so layout does not shift on swap
- `signOut` sets `loading=true` as its first statement — this triggers `ShellSkeleton` before Supabase `signOut()` resolves, making logout feel instant
- `KeyboardManager` calls `e.preventDefault()` on all matched shortcuts (both direct and chord) — prevents the shortcut character from typing into an auto-focused input that opens as a result of the shortcut
- `CreateProjectDialog` is a global component mounted in `AppShell`, controlled via `UIContext.projectCreateOpen` — any component can open it via `openProjectCreate()` without prop drilling
- Sidebar nav restriction: `projects.length === 0` hides Tasks/My Day/Matrix (not `!activeProject`) — `!activeProject` alone would lock out users who have projects but whose localStorage was cleared
- Q shortcut checks `projects.length === 0` (via ref) to decide whether to open the project dialog or the task create panel — same ref pattern as `activeProject` to avoid stale closures
- iOS Safari auto-zoom is triggered when any input/textarea/select has font-size < 16px — fixed globally via `@media (max-width: 767px)` rule with `!important` to override Tailwind utility classes; `!important` is justified here because this is a platform constraint override, not a design decision
- `addTask` in TasksContext returns `Promise<string | null>` (the real DB task ID) so callers can transition to edit mode for the newly created task; the optimistic temp ID (`temp-${Date.now()}`) is intentionally not returned — callers always need the real persisted ID
- Create task panel transitions to edit mode (not close) on successful save — user gets immediate access to subtasks/labels/dependencies/comments without reopening; if DB call fails, falls back to `handleClose()`
- `Topbar` uses `useProjects` to resolve the active project name for `/projects/[id]` routes — avoids prop drilling from the page; `Topbar.test.tsx` mocks `useProjects` returning an empty projects array
- Label filter uses AND logic (`.every()`) not OR (`.some()`) — when multiple labels are selected, a task must have all of them to appear in results; this matches the expected "narrowing" UX where each added label further refines the list

## Known issues / one-time setup required

### P1.10 auth checklist status (2026-05-14)
- ✓ Email signup → verify → workspace created → dashboard loads with workspace name
- ✓ Resend verification (60s cooldown works; 429 rate limit hit from Supabase free tier — not an app bug. Fix: add custom SMTP in Supabase Dashboard → Auth → SMTP Settings)
- ✓ Login with unverified email → correct "please verify" message shown
- ✓ Google OAuth → new user → workspace created → dashboard loads
- ✓ Sign out → /login → /dashboard redirects back to /login
- ✓ workspace_members RLS self-referential bug fixed (see RLS fix below)
- ✓ Google OAuth always shows account picker (prompt: select_account added)
- ✗ Google OAuth + same email/password account merge — needs email sending
- ✗ Forgot password flow — needs email sending
- ✗ Reset link used twice — needs email sending
- ✗ Change email — needs email sending
- ✗ Change password — needs email sending
- ✓ Delete account → data removed → cannot log in → login page shows deleted-account banner (FK cascades fixed — see Known Issues)
- ✗ Session expiry redirect — not yet tested
- ✓ RLS two-account verification — PASS (2026-05-16): workspaces, projects, tasks, labels, subtasks, comments — no crossover observed between User A and User B in two simultaneous browser profiles

### workspace_members RLS fix (already run — 2026-05-14)
The original self-referential policy caused PostgreSQL to return zero rows for all workspace_members queries, making workspace permanently null. Fixed by running in Supabase SQL Editor:
```sql
DROP POLICY IF EXISTS "members can see workspace members" ON workspace_members;
CREATE POLICY "members can see workspace members" ON workspace_members
FOR ALL USING (user_id = auth.uid());
```
For v2 collaboration, expand this to also show co-members in shared workspaces.

### Manual workspace bootstrap for pre-existing accounts
Any Google OAuth account that first logged in BEFORE the workspace-creation code was added to `/callback` will have no `workspace_members` row. Create one manually in the SQL Editor:
```sql
WITH new_ws AS (
  INSERT INTO workspaces (name, slug, owner_id)
  VALUES ('Name''s workspace', 'name-workspace-' || substr(gen_random_uuid()::text, 1, 8), '<user_id>')
  RETURNING id
)
INSERT INTO workspace_members (workspace_id, user_id, role)
SELECT id, '<user_id>', 'owner' FROM new_ws;
```



### Supabase table grants (already run — documented for fresh environments)
"Automatically expose new tables" is disabled, so PostgreSQL table-level grants are not applied automatically. Must run once in Supabase SQL Editor:
```sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
```
Without this, the service role client gets "permission denied for table workspaces" (Postgres error 42501) even though it bypasses RLS.

### Non-blocking
- Next.js 15 webpack build shows two "Serializing big strings" warnings — non-breaking, cosmetic only
- Build warning: `<img>` in profile/page.tsx — pre-existing, not a bug
- Build warning: `_userId` unused in lib/auth.ts — pre-existing, not a bug
- Build warning: `useEffect` missing dependency `handleClose` in TaskDetail.tsx — intentional; including it would cause infinite re-renders

- **Board card label dots** — replaced the redundant priority dot (mirroring the left-border color) on board cards with label dots:
  - `TasksContext` now fetches `labels: Label[]` alongside tasks and `taskLabelIds` on workspace load, exposing them from context
  - `BoardView` (`CardUI`, `SortableCard`, `BoardColumn`) extended with optional `taskLabelIds` and `labels` props
  - Board cards now render one 8px dot per assigned label (using that label's stored color); if a task has no labels the dot row is absent entirely
  - `tasks/page.tsx` and `projects/[id]/page.tsx` pass `taskLabelIds` and `labels` from `useTasks()` to `BoardView`
  - Priority is already communicated by the left-border color — removing the dot eliminates the redundancy

## Session 2026-05-16 end-of-session checklist (session 12)
- type-check: **PASS** (0 errors)
- tests: **PASS** (51 files, 439 tests)
- coverage: **86.76% statements (1527/1760) / 89.56% lines (1322/1476) / 77.83% branches (843/1083) / 79.41% functions (436/549)** — all Phase 2 thresholds exceeded
- build: **PASS** (warnings only — all pre-existing, non-breaking)

- **P3.0 — AI infrastructure** — `lib/ai/client.ts` (Anthropic singleton + AI_MODEL constant), `lib/ai/parse.ts` (extractJSON strips fences + JSON.parse + throws on failure), `lib/rate-limit.ts` (aiRatelimit sliding window 10/min + checkRateLimit helper returning 429 Response); 6 new tests (4 parse + 2 rate-limit); 53 files, 445 tests total, type-check clean

- **P3.1 — Natural language task creation** — `lib/ai/tasks.ts` (`createTaskFromPrompt` with one retry on JSON parse failure); `app/api/ai/create-task/route.ts` (POST: auth → rate limit → validate → AI → 200); `components/ai/AICommandBar.tsx` (textarea + Generate button + inline AIPreviewCard with priority badge, title, description, due date, est. mins; "Create task" calls `addTask` + closes, "Cancel" discards); AI button in Tasks page header; Alt+N keyboard shortcut (registered in AppShortcuts via new `alt` modifier support in KeyboardManager); `aiBarOpen`/`toggleAiBar`/`closeAiBar` added to UIContext; 16 new tests (4 lib + 6 api + 6 component); 56 files, 461 tests total, type-check clean

## In progress
None.

## Next task
P3.2 — Task breakdown:
- `lib/ai/tasks.ts` — `breakdownTask(taskId): Promise<AISubtaskSuggestion[]>`
- `app/api/ai/breakdown/route.ts` — POST: auth → rate limit → fetch task → AI → subtask array
- `components/ai/AITaskBreakdown.tsx` — "Break this down" button in TaskDetail, subtask checkboxes (all checked by default), confirm creates only checked subtasks

## Decisions made (continued)
- Board card priority dot removed — priority is already communicated by the left-border color; the dot was redundant; replaced by label dots (one per assigned label, using the label's own color)
- `labels: Label[]` lifted into `TasksContext` alongside `taskLabelIds` — both are needed at the same level (board cards) and fetching once in context avoids duplicate `getLabels()` calls per component
- `Ratelimit.slidingWindow` is a static method — `vi.mock('@upstash/ratelimit')` must include it via `Object.assign` on the mock constructor, or use a regular `function MockRatelimit()` with `MockRatelimit.slidingWindow = vi.fn()` — arrow function mocks cannot be used as constructors (`new`) so `vi.fn().mockImplementation(() => ({...}))` fails; a regular function returning an object works
- `mockLimit` (mock for `aiRatelimit.limit`) must be defined at module scope with the `mock` prefix so Vitest's hoisting allows it to be referenced inside the `vi.mock` factory
- `lib/ai/client.ts` is excluded from meaningful coverage (0% statements) because the module only exports an Anthropic singleton and a constant — there is no callable logic to test; the singleton is always mocked in tests that use it
- `createTaskFromPrompt` retry: outer try/catch calls `attempt()` twice — first failure is silently swallowed, second failure propagates; `extractJSON` throws on bad JSON so parse failure always triggers the retry path
- `Shortcut` interface gained `alt?: boolean`; `KeyboardManager` `buildMapKey` prefixes `alt+` and `listener` reads `e.altKey`; Alt+N toggles the AI bar globally via `toggleAiBar` from UIContext
- `aiBarOpen`/`toggleAiBar`/`closeAiBar` live in UIContext (not Tasks page local state) so the Alt+N global shortcut can control the bar from AppShortcuts without prop drilling

## Test status (Phase 2 close-out — 2026-05-16)
- `npm run type-check`: PASS (0 errors)
- `npm test`: PASS (51 files, 415 tests)
- `npm run test:coverage`: PASS — all Phase 2 thresholds exceeded
- `npm run build`: PASS (warnings only — all pre-existing, non-breaking)
- Coverage (Phase 2 targets: Lines ≥ 75%, Functions ≥ 75%, Branches ≥ 70%):
  - Statements: 84.10% (1471/1749) ✓
  - Branches:   74.51% (804/1079) ✓
  - Functions:  77.20% (420/544) ✓
  - Lines:      87.73% (1287/1467) ✓
  - All Phase 2 targets met. Configured vitest threshold remains at 70/70/65 (Phase 1 values) — all pass comfortably.

## Session 2026-05-16 end-of-session checklist (session 13 — Phase 3 start)
- type-check: **PASS** (0 errors)
- tests: **PASS** (53 files, 445 tests)
- coverage: **86.73% statements (1536/1771) / 89.50% lines (1331/1487) / 77.88% branches (845/1085) / 79.49% functions (438/551)** — all above Phase 2 thresholds; Phase 3 targets (Lines ≥ 80%, Functions ≥ 80%, Branches ≥ 75%) not yet required
- build: **PASS** (warnings only — all pre-existing, non-breaking)

## Session 2026-05-17 end-of-session checklist (session 14 — P3.1)
- type-check: **PASS** (0 errors)
- tests: **PASS** (56 files, 461 tests)
- coverage: **86.71% statements (1599/1844) / 89.69% lines (1392/1552) / 77.83% branches (885/1137) / 79.29% functions (448/565)** — all above Phase 2 thresholds; Phase 3 targets (Lines ≥ 80%, Functions ≥ 80%, Branches ≥ 75%): lines ✓ branches ✓ functions just under (79.29% vs 80%)
- build: **PASS** (warnings only — all pre-existing, non-breaking)
