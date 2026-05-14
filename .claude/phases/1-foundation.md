# Phase 1 — Foundation

**Complete this phase entirely before starting Phase 2.**

## What to build

- [ ] Supabase Auth: email/password + Google OAuth
- [ ] `/verify-email` page with resend + 60s cooldown
- [ ] Expired session handling: redirect to `/login?reason=expired` + banner
- [ ] Auto-create workspace + workspace_member + profile on signup (in `/callback`)
- [ ] App shell: sidebar (240px dark), topbar (46px), route structure
- [ ] Project CRUD
- [ ] Task CRUD: create, edit, delete, archive
- [ ] Quick capture: `Q` shortcut, floating input, saves to inbox
- [ ] Inbox / triage view
- [ ] List view: sortable, basic filters
- [ ] Task detail panel: J/K navigation between tasks
- [ ] Undo toast: 5s window for archive + delete
- [ ] Keyboard shortcut foundation (`lib/keyboard.ts`) + `?` reference sheet
- [ ] Profile settings: display name, avatar upload (resize to 256x256 client-side)
- [ ] Account settings: change email, change/set password, sessions, delete account
- [ ] Workspace settings: name, color, timezone, end-of-day time

## Auth flow summary

| Route | Behaviour |
|-------|-----------|
| `/login` | Email + password + Google OAuth. Error: don't clear email field. Unverified email: show resend link. |
| `/signup` | Email + password + confirm. Google OAuth. After submit → `/verify-email`. Don't log in yet. |
| `/verify-email` | "Check your inbox" holding page. Resend with 60s cooldown. "Wrong email? Go back" link. |
| `/forgot-password` | Email → send reset link. Always show generic message regardless of whether email exists. |
| `/reset-password` | Token in URL (Supabase handles). New + confirm password. Success → `/login` after 2s. Expired token → show message + link back. |
| `/callback` | Exchanges OAuth code. Creates workspace if first login. Redirects to `/dashboard`. |

**Session expiry:** middleware catches → `/login?reason=expired` → banner on login page.

## Tests to write (Phase 1)

**`lib/tasks.test.ts`:**
- `filterTasks` handles each filter type + multiple active + no filters
- `sortTasks` sorts correctly by each field
- `getFractionalPosition` — empty list, start insert, end insert, between two items

**`lib/projects.test.ts`:**
- `getProjectById` returns null for unknown id
- `archiveProject` sets status to 'archived'

**`components/task/TaskForm.test.tsx`:**
- Renders all fields
- Validation error on empty title submit
- Calls `onSubmit` with correct payload
- Due date rejects past dates
- Priority dropdown shows all four options

**`components/shared/PriorityBadge.test.tsx`:**
- Correct label per priority
- Correct color class per priority

**`components/shared/FilterBar.test.tsx`:**
- Status filter calls `onChange` correctly
- Clearing resets to empty
- Multiple filters can be active simultaneously

## Auth testing checklist (complete before Phase 2)

- [ ] Email signup → verification email → link confirms → workspace created → dashboard loads
- [ ] Resend verification with 60s cooldown works
- [ ] Login with unverified email shows correct message
- [ ] Google login → new user → workspace created → dashboard loads
- [ ] Google login → existing email/password user → accounts merged → single workspace
- [ ] Forgot password → email received → reset link works → can log in with new password
- [ ] Reset link used twice → "expired" message on second attempt
- [ ] Session expiry → graceful redirect with banner
- [ ] Sign out → redirected to login → cannot access app routes
- [ ] Change email → confirmation sent → old email works until confirmed
- [ ] Change password (email user) → can log in with new password
- [ ] Set password (Google user) → can now log in with email + password
- [ ] Delete account → all data removed → cannot log in → deletion message on login page
- [ ] Sign out all other sessions → other tabs redirected to login

## Coverage target after Phase 1
Lines ≥ 70% · Functions ≥ 70% · Branches ≥ 65%
