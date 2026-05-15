# Phase 1 — Remaining Items Roadmap

P1.1–P1.7 are complete. P1.8 and P1.9 have been moved to PHASE2ROADMAP.md where
their dependencies live. Only P1.10 (in progress) and P1.11 (final checklist) remain.

---

## Status

```
P1.1  Error pages & broken nav stubs   ✓ Complete
P1.2  Toast system                     ✓ Complete
P1.3  Settings layout                  ✓ Complete
P1.4  Profile settings                 ✓ Complete
P1.5  Account settings                 ✓ Complete
P1.6  Workspace settings               ✓ Complete
P1.7  Keyboard foundation + Q capture  ✓ Complete
P1.8  Undo toast integration           → moved to PHASE2ROADMAP.md after PROMPT 2
P1.9  Keyboard reference sheet         → moved to PHASE2ROADMAP.md after PROMPT 13
P1.10 Manual auth & RLS verification   ← in progress (see verified items below)
P1.11 Phase 1 final checklist          ← do after P1.10 complete
```

---

## PROMPT P1.1 — Error pages & broken nav stubs

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/1-foundation.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.

Three problems to fix before starting any feature work:

PROBLEM 1 — Missing error boundary pages
Next.js App Router requires error.tsx and not-found.tsx files to prevent white
screens on unhandled errors. Build:

  app/not-found.tsx
    - "404 — Page not found" with a back link to /dashboard
    - Matches the lodestar design: dark background, cerulean accent, Inter font
    - No auth required (server component)

  app/error.tsx
    - Top-level error boundary (must be 'use client')
    - Shows "Something went wrong" message + "Try again" button (calls reset())
    - Link back to /dashboard
    - Logs error to console in development only

  app/(app)/error.tsx
    - Same shape as app/error.tsx but inside the authenticated shell
    - Shows error within the sidebar/topbar layout rather than full-screen

PROBLEM 2 — Broken nav link: /matrix
The Sidebar links to /matrix. This 404s on click. Build a placeholder:

  app/(app)/matrix/page.tsx
    - Client component
    - "Matrix view — coming soon" message centered in the page
    - No functionality

PROBLEM 3 — Broken nav links: /projects and /settings
BottomNav links to both. Build placeholders:

  app/(app)/projects/page.tsx
    - Renders a list of projects from useProjects()
    - Each project is a card: color swatch + name + "Open" button (links to /projects/[id])
    - "New project" button opens a simple dialog: name field + 6 preset color swatches
      (use useProjects().addProject on submit)
    - This is the real projects list page, not just a stub

  app/(app)/settings/page.tsx
    - Redirect to /settings/profile (server component, use redirect())
    - The full settings pages come in P1.3–P1.6

Read .claude/design.md for colors and component classes before writing.

Write tests:
  tests/components/projects/ProjectsPage.test.tsx
    - Renders project cards
    - "New project" button opens dialog
    - Submitting dialog calls addProject with name and color

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark error pages and nav stubs complete, next = Toast system.
```

---

## PROMPT P1.2 — Toast notification system

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/1-foundation.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.

Build a toast notification system. It will be used by the undo toast (archive/delete)
and general success/error feedback throughout the app.

Read .claude/design.md before writing.

UIContext already has undoStack, pushUndo, and dismissUndo. The toast system wraps
those with a visible UI.

Step 1 — `components/ui/Toast.tsx` (not a shadcn component — build it):
  A fixed overlay at the bottom-right of the screen (bottom-4 right-4, z-50).
  Renders one toast per item in UIContext.undoStack.

  Each toast:
    - Dark surface card (var(--surface), border 0.5px var(--border), rounded-lg)
    - Message text on the left
    - Optional action button (e.g. "Undo") — if provided, clicking it calls item.undo()
      then dismisses
    - × close button on the right (aria-label="Dismiss")
    - Auto-dismisses after 5 seconds (use useEffect + setTimeout per toast)
    - Entrance animation: slide up + fade in (Tailwind transition classes)

  The UndoItem interface in UIContext already has { label: string; undo: () => void }.
  Extend it: add optional `message?: string` — if not provided, use label as the
  display text. Update UIContext.tsx and UIContext type to add message?.

Step 2 — Render Toast in `app/(app)/layout.tsx`:
  Add <Toast /> inside the UIProvider, after the main content area.

Step 3 — `tests/components/ui/Toast.test.tsx`:
  - Renders nothing when undoStack is empty
  - Renders a toast when undoStack has an item
  - Clicking × calls dismissUndo
  - Clicking "Undo" button calls item.undo() then dismisses
  - Uses vi.useFakeTimers() — toast auto-dismisses after 5000ms

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark Toast system complete, next = Settings layout.
```

---

## PROMPT P1.3 — Settings layout & navigation

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/1-foundation.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.

Build the settings section shell. Settings live at /settings/* inside the
authenticated app layout.

Read .claude/design.md before writing.

Step 1 — `app/(app)/settings/layout.tsx`:
  A two-column layout:
    Left column (200px, dark sidebar): vertical nav with three links:
      - Profile (/settings/profile)
      - Account (/settings/account)
      - Workspace (/settings/workspace)
    Active link gets cerulean accent (same style as main Sidebar).
    Right column: renders {children}

  On mobile (below md breakpoint): left nav collapses to a horizontal tab strip
  above children.

Step 2 — Update `app/(app)/settings/page.tsx`:
  Was a redirect stub. Keep it as redirect('/settings/profile').

Step 3 — `tests/components/settings/SettingsLayout.test.tsx`:
  - Renders three nav links
  - Active link has correct class for each path
  - Children rendered in right column

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark Settings layout complete, next = Profile settings.
```

---

## PROMPT P1.4 — Profile settings

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/1-foundation.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.

Build `app/(app)/settings/profile/page.tsx` — display name and avatar.

Read .claude/design.md and .claude/schema.md (profiles table) before writing.

Step 1 — `lib/profile.ts`:
  - updateDisplayName(userId: string, displayName: string): Promise<void>
      Updates profiles.display_name where id = userId
  - updateAvatar(userId: string, avatarUrl: string): Promise<void>
      Updates profiles.avatar_url where id = userId
  - uploadAvatar(userId: string, file: File): Promise<string>
      Resizes the image client-side to 256×256 using browser-image-compression
      (already installed), then uploads to Supabase Storage bucket 'avatars' at
      path `{userId}/avatar.{ext}`. Returns the public URL.
      Use createClient() (browser client) for the storage upload.

Step 2 — `tests/lib/profile.test.ts`:
  - updateDisplayName: calls supabase update with correct args; throws on error
  - updateAvatar: calls supabase update with correct args; throws on error
  - uploadAvatar: mock browser-image-compression + supabase.storage.from().upload()
    — returns the public URL on success; throws on storage error

Run `npm test` after this step.

Step 3 — `app/(app)/settings/profile/page.tsx` (client component):
  Uses useAuth() for user and profile.

  Sections:
    Avatar:
      - Shows current avatar (img with src=profile.avatar_url) or initials circle
        if no avatar
      - "Change photo" button opens a file input (accept="image/*")
      - On file select: call uploadAvatar → updateAvatar → update AuthContext profile
        optimistically; revert + show error toast on failure
      - Loading spinner overlay on the avatar while uploading

    Display name:
      - Text input pre-filled with profile.display_name
      - "Save" button — calls updateDisplayName → update AuthContext profile
      - Inline success message ("Saved") for 2s after successful save
      - Validation: minimum 1 character; maximum 50

Step 4 — `tests/components/settings/ProfileSettingsPage.test.tsx`:
  - Renders display name input pre-filled with profile value
  - Saving empty display name shows validation error
  - Saving valid name calls updateDisplayName
  - File input triggers uploadAvatar + updateAvatar on change

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark Profile settings complete, next = Account settings.
```

---

## PROMPT P1.5 — Account settings

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/1-foundation.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.

Build `app/(app)/settings/account/page.tsx` — email, password, and account deletion.

Read .claude/schema.md and .claude/rules/security.md before writing.

All mutations in this page go through the existing auth helpers in lib/auth.ts
(sendPasswordReset, updatePassword already exist). Add two new helpers.

Step 1 — Add to `lib/auth.ts`:
  - updateEmail(newEmail: string): Promise<void>
      Calls supabase.auth.updateUser({ email: newEmail })
      Supabase sends a confirmation email to the new address; the change is
      pending until confirmed.
  - deleteAccount(userId: string): Promise<void>
      IMPORTANT: Must call a server route, never the admin API client-side.
      Call fetch('/api/auth/delete-account', { method: 'POST' })

Step 2 — `app/api/auth/delete-account/route.ts` (POST):
  - Creates a server-side Supabase client (createServerClient from lib/supabase/server)
  - Gets the current user via getUser() — if no session, return 401
  - Creates an admin client (createAdminClient from lib/supabase/admin)
  - Calls adminClient.auth.admin.deleteUser(user.id)
  - Returns 200 on success, 500 on failure with { message: string }

Step 3 — `tests/lib/auth.test.ts` additions:
  - updateEmail: calls supabase.auth.updateUser with { email: newEmail }; throws on error
  - deleteAccount: calls fetch('/api/auth/delete-account'); throws on non-ok response

  `tests/api/delete-account.test.ts`:
  - No session → 401
  - Valid session → calls admin.deleteUser with correct userId → 200
  - Admin delete fails → 500 with message

Run `npm test` after this step.

Step 4 — `app/(app)/settings/account/page.tsx` (client component):
  Uses useAuth() for user and profile.

  Sections:
    Email:
      - Shows current email (read-only text)
      - "Change email" button opens an inline form: new email input + "Send
        confirmation" button
      - Calls updateEmail; shows "Confirmation sent to {newEmail}" on success
      - Security.md rule: never reveal whether an email is already registered

    Password:
      - "Change password" button — calls sendPasswordReset(user.email) and shows
        "Reset link sent to your email"
      - For Google-only accounts (no password set): label says "Set a password"
        — same behavior (sends reset email which also sets password)

    Danger zone:
      - "Delete account" button (red border)
      - Opens a confirmation Dialog: type the word "delete" to enable the confirm button
      - On confirm: calls deleteAccount() → signs out → redirects to /login with
        ?deleted=true
      - Login page already shows expired-session banner — reuse same banner for
        ?deleted=true with message "Your account has been deleted."

Step 5 — `tests/components/settings/AccountSettingsPage.test.tsx`:
  - Renders current email
  - "Send confirmation" calls updateEmail
  - "Change password" calls sendPasswordReset
  - Delete dialog requires typing "delete" before confirm button is enabled
  - Confirming deletion calls deleteAccount

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark Account settings complete, next = Workspace settings.
```

---

## PROMPT P1.6 — Workspace settings

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/1-foundation.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.

Build `app/(app)/settings/workspace/page.tsx` — workspace name, color, timezone,
end-of-day time.

Read .claude/schema.md (workspaces table columns) and .claude/design.md before writing.

Step 1 — `lib/workspace.ts`:
  - updateWorkspace(
      id: string,
      updates: Partial<Pick<Workspace, 'name' | 'color' | 'timezone' | 'end_of_day_time'>>
    ): Promise<Workspace>
    Updates the workspaces row and returns the full updated row.

Step 2 — `tests/lib/workspace.test.ts`:
  - updateWorkspace: calls supabase update with correct args; returns updated row;
    throws on error

Run `npm test` after this step.

Step 3 — `app/(app)/settings/workspace/page.tsx` (client component):
  Uses useAuth() for workspace. Only workspace owners (member.role === 'owner') can
  edit — show a read-only view for non-owners.

  Fields:
    Workspace name (text input, 1–60 chars, save button)
    Color (6 preset cerulean/steel swatches + custom hex input, saves immediately
      on pick)
    Timezone (select from a curated list of ~20 common IANA timezones,
      e.g. 'America/New_York', 'Europe/London', 'Asia/Tokyo' — hardcode the list)
    End-of-day time (time input HH:MM, saves on blur)

  All saves call updateWorkspace and then update AuthContext workspace via a
  setWorkspace callback. Add setWorkspace to AuthContext:
    - In AuthContext, expose setWorkspace: (ws: Workspace) => void
    - Update AuthContextValue interface accordingly

  Optimistic UI: update AuthContext workspace immediately, revert on DB error,
  show toast on failure.

Step 4 — `tests/components/settings/WorkspaceSettingsPage.test.tsx`:
  - Renders current workspace name
  - Non-owner sees read-only view
  - Saving name calls updateWorkspace
  - Picking a color calls updateWorkspace with color
  - Changing timezone calls updateWorkspace with timezone

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark Workspace settings complete, next = Keyboard foundation.
```

---

## PROMPT P1.7 — Keyboard shortcut foundation + Quick capture

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/1-foundation.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.

Build the keyboard shortcut system and the Q quick-capture shortcut.

Read .claude/design.md before writing.

Step 1 — `lib/keyboard.ts`:
  A lightweight global keyboard shortcut manager.

  export type ShortcutHandler = (e: KeyboardEvent) => void

  export interface Shortcut {
    key: string           // e.g. 'q', '?', 'Escape'
    meta?: boolean        // Cmd/Ctrl
    shift?: boolean
    description: string   // shown in the ? reference sheet
    handler: ShortcutHandler
  }

  export class KeyboardManager {
    private shortcuts: Map<string, Shortcut> = new Map()

    register(shortcut: Shortcut): () => void
      // Adds shortcut. Returns an unregister function.
      // Key for the map: `${meta?'meta+':''}${shift?'shift+':''}${key}`

    private listener = (e: KeyboardEvent) => void
      // Skips if e.target is an input, textarea, or [contenteditable]
      // Finds and calls the matching shortcut handler

    mount(): void   // adds the listener to window
    unmount(): void // removes it
    getAll(): Shortcut[]  // for the ? reference sheet
  }

  export const keyboard = new KeyboardManager()
  // Singleton — components call keyboard.register() in a useEffect

Step 2 — `tests/lib/keyboard.test.ts`:
  - register returns an unregister function that removes the shortcut
  - listener calls the handler for the matching key
  - listener ignores events when target is an input
  - listener ignores events when target is a textarea
  - getAll returns all registered shortcuts

Run `npm test` after this step.

Step 3 — `components/ui/QuickCapture.tsx`:
  A floating modal that opens when Q is pressed anywhere in the app (outside inputs).

  Behavior:
    - Single text input, auto-focused, placeholder "Capture a task…"
    - Enter creates a task via useTasks().addTask({ title, project_id: null }) and
      closes the modal
    - Escape closes without creating
    - Clicking backdrop closes without creating
    - On open: register an Escape handler; on close: unregister it

  Register the Q shortcut in the component using useEffect:
    import { keyboard } from '@/lib/keyboard'
    useEffect(() => {
      return keyboard.register({
        key: 'q',
        description: 'Quick capture',
        handler: () => setOpen(true),
      })
    }, [])

  Render <QuickCapture /> inside UIProvider in `app/(app)/layout.tsx`.

Step 4 — `tests/components/ui/QuickCapture.test.tsx`:
  - Modal is hidden initially
  - Dispatching a 'q' keydown event opens the modal
  - Typing a title and pressing Enter calls addTask and closes
  - Pressing Escape closes without calling addTask

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark Keyboard foundation + Quick capture complete,
next = Undo toast integration (after Phase 2 TaskRow is built).
```

---

## P1.8 — Undo toast integration

**Moved to PHASE2ROADMAP.md** — inserted after PROMPT 2 (TaskRow), which is its dependency.

---

## P1.9 — Keyboard reference sheet

**Moved to PHASE2ROADMAP.md** — inserted after PROMPT 13 (Due date & Snooze), once all
Phase 2 keyboard shortcuts are defined.

---

## PROMPT P1.10 — Manual auth & RLS verification *(in progress)*

Verified 2026-05-14 (partial — email-dependent items blocked by Supabase rate limit):

AUTH TESTING CHECKLIST:

  [x] Email signup → verification email received → confirm link → workspace created
      → /dashboard loads with workspace name showing in sidebar
  [x] Resend verification email — 60s cooldown works; Supabase 429 rate limit hit
      during testing (not an app bug — fix: add custom SMTP in Supabase Dashboard)
  [x] Login with unverified email → correct "please verify" message shown
  [x] Google OAuth → new user → workspace created → /dashboard loads
  [x] Sign out → redirected to /login → /dashboard redirects back to /login
  [x] Delete account → data removed → cannot log in → deleted banner on login page
  [x] Session expiry banner — middleware logic verified correct (requires real JWT
      expiry to trigger; manual cookie deletion is not equivalent)
  [ ] Google OAuth + same email/password account → merged → single workspace
      (blocked: needs email sending)
  [ ] Forgot password flow (blocked: needs email sending)
  [ ] Reset link used twice → expired message (blocked: needs email sending)
  [ ] Change email (blocked: needs email sending)
  [ ] Change password (blocked: needs email sending)

RLS VERIFICATION CHECKLIST:
  [ ] User B cannot see User A's workspaces/projects/tasks
  [ ] User B cannot update User A's tasks
  [ ] User B cannot see User A's workspace_members row

Bugs found and fixed during P1.10 (see PROGRESS.md Known Issues):
  - workspace_members self-referential RLS → fixed to user_id = auth.uid()
  - Missing workspace for pre-OAuth accounts → manual SQL bootstrap documented
  - Google OAuth button showed account picker only once → prompt: select_account added
  - FK cascade missing on auth.users → added ON DELETE CASCADE/SET NULL to 7 tables
  - No sign-out button in UI → avatar dropdown added to Topbar

Resume remaining items after setting up custom SMTP in Supabase.

---

## PROMPT P1.11 — Phase 1 final checklist

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/1-foundation.md, and
PROGRESS.md in that order. Confirm: current phase, last completed task, next task.

This is the Phase 1 close-out prompt. Do not build new features — only validate
and document.

Run all four in order. Fix everything before moving to the next:

1. npm run type-check   — zero TypeScript errors
2. npm test             — all tests pass (never delete a failing test — fix the code)
3. npm run test:coverage — Phase 1 thresholds:
     Lines ≥ 70% · Functions ≥ 70% · Branches ≥ 65%
   If below: identify gaps from the report, write missing tests, re-run.
4. npm run build        — zero errors

After all four pass, update PROGRESS.md:
  - Confirm "Current phase: Phase 1 — Foundation (complete)"
  - Move remaining items into Completed
  - Update Test status section with actual passing numbers
  - Note: manual auth checklist (P1.10) must be verified separately in browser
```

---

## Summary

| Prompt | Feature | Deps |
|--------|---------|------|
| P1.1 | Error pages + /matrix, /projects, /settings stubs | None |
| P1.2 | Toast notification system | None |
| P1.3 | Settings layout & nav | None |
| P1.4 | Profile settings (display name, avatar) | P1.3 |
| P1.5 | Account settings (email, password, delete) | P1.3 |
| P1.6 | Workspace settings (name, color, timezone) | P1.3 |
| P1.7 | Keyboard foundation + Q quick capture | None |
| P1.8 | Undo toast wired to TaskRow | Phase 2 P2 (TaskRow) |
| P1.9 | ? Keyboard reference sheet | Phase 2 complete |
| P1.10 | Manual auth + RLS verification | No code |
| P1.11 | Phase 1 final checklist | All above |
