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

## Next task
My Day page — `app/(app)/my-day/page.tsx`

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
- Callback uses `next=` query param for routing after OAuth — clean separation between signup and password-reset flows
- `/reset-password` excluded from middleware's authenticated-user redirect — recovery session must reach the page
- `createRouteHandlerClient` pattern: build the redirect response FIRST, pass it to the client so `exchangeCodeForSession` writes session cookies directly onto the redirect response
- `createAdminClient` (service role) used for workspace/member bootstrapping — anon client's self-referential RLS blocks new users' first INSERT
- Downgraded Next.js 16 → 15 — Next.js 16 uses Turbopack by default causing OOM crashes; Next.js 15 uses Webpack by default
- `pool: 'forks'` in vitest.config.ts — prevents cross-file mock contamination on Windows
- All test mocks must use `mockResolvedValueOnce` (never bare `mockResolvedValue`) — permanent defaults survive `vi.clearAllMocks()` and leak across test files on Windows
- TasksContext reads `authLoading` from AuthContext before deciding to setLoading(false) — prevents loading flickering to false before auth resolves, which caused race conditions in tests and incorrect UX
- `workspace_members` RLS policy changed from self-referential to `user_id = auth.uid()` — the original policy caused PostgreSQL to detect recursion and return empty rows, making workspace permanently null in AuthContext (verified 2026-05-14)

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

## Test status (P2.5 end-of-session — 2026-05-14)
- `npm run type-check`: PASS (0 errors)
- `npm test`: PASS (27 files, 209 tests)
- `npm run test:coverage`: PASS
  - Statements : 89.66% (503/561)
  - Branches   : 82.16% (281/342)
  - Functions  : 84.82% (123/145)
  - Lines      : 91.41% (426/466)
- `npm run build`: PASS (0 errors, 2 pre-existing warnings)
- Phase 2 threshold (Lines ≥ 75%, Functions ≥ 75%, Branches ≥ 70%): MET (all thresholds exceeded by ≥ 9%)
