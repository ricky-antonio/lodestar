# Lodestar — Progress

## Current phase
Phase 2 — Views + Organization (**in progress**)

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

## Next task
Bulk board actions & search correctness

Remaining P1.10 items (complete in parallel, do not block Phase 2):
- Set up custom SMTP in Supabase Dashboard → Auth → SMTP Settings, then verify:
  - Google OAuth + same email/password account → merged → single workspace
  - Forgot password flow
  - Reset link used twice → expired message
  - Change email
  - Change password
- RLS two-account verification (no email needed — two browser profiles)

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
- Date-only comparisons against `due_date` (YYYY-MM-DD strings) must use local date components, not `toISOString()` (UTC) — `toISOString()` can return tomorrow's date in timezones ahead of UTC, making today's tasks appear overdue
- Gear dropdown for Archive/Delete: delete confirmation uses a panel strip (not a second button state) because shadcn DropdownMenu closes on item click — the strip renders below the header and persists until Cancel or Confirm is clicked

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
- ✗ RLS two-account verification — not yet tested

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

## Test status (end of session — 2026-05-15, session 4)
- `npm run type-check`: PASS (0 errors)
- `npm test`: PASS (42 files, 310 tests)
- `npm run test:coverage`: PASS (above configured 70/70/65 thresholds)
- `npm run build`: PASS (warnings only — `_status` unused, `<img>` in profile, missing dep in useEffect — all pre-existing non-blocking)
- Coverage (Phase 2 targets: Lines ≥ 75%, Functions ≥ 75%, Branches ≥ 70%):
  - Statements: 81.40% (1081/1328) ✓
  - Branches:   73.59% (588/799) ✓
  - Functions:  75.11% (323/430) ✓
  - Lines:      84.48% (931/1102) ✓
  - All Phase 2 targets met. Configured vitest threshold remains at 70/70/65 (Phase 1 values) — all pass comfortably.
