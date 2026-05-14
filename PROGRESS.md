# Lodestar — Progress

## Current phase
Phase 1 — Foundation

## Completed
- Pre-build setup: Supabase (18 tables, RLS, triggers, constraints all verified), Google OAuth, Anthropic API, Upstash Redis
- Next.js scaffold with full dependency stack (Tailwind, shadcn/ui, dnd-kit, Chart.js, Vitest, RTL)
- `lib/types.ts` — all TypeScript interfaces for every DB table + AppError, FilterState, TaskWithRelations
- `lib/utils.ts` — cn() helper (6 tests, 100% coverage)
- `lib/supabase/client.ts` — browser Supabase client
- `lib/supabase/server.ts` — SSR Supabase client (cookie-based)
- `middleware.ts` — session refresh, expired-session detection (?reason=expired), route protection, /reset-password excluded from auth redirect
- `tests/mocks/supabase.ts` — shared Supabase mock (single source of truth, includes resend/exchangeCodeForSession/verifyOtp)
- `tests/mocks/anthropic.ts` — shared Anthropic mock with success + error helpers
- `tests/lib/utils.test.ts` — 6 tests, all passing
- `.claude/rules/testing.md` — full testing discipline rules added
- Session management system: Required Reading block in CLAUDE.md, PROGRESS.md handoff
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

## In progress
- Nothing — ready for next task

## Next task
Build the app shell (`app/(app)/` group):
1. `app/(app)/layout.tsx` — wraps sidebar + topbar + content area; mounts AuthContext, ProjectsContext, TasksContext, UIContext
2. `components/layout/Sidebar.tsx` — 240px dark (#061419), collapsible to 56px icon rail, workspace name, nav items (Dashboard/Inbox/My Day/Matrix), project list with colored dots
3. `components/layout/BottomNav.tsx` — mobile-only (< 768px), 5 items, cerulean active state
4. `components/layout/Topbar.tsx` — 46px, view title, breadcrumb, action buttons
5. `lib/context/AuthContext.tsx` — user, workspace, profile, theme sync
6. `lib/context/ProjectsContext.tsx` — all projects in workspace, active project
7. `lib/context/TasksContext.tsx` — tasks for active project, CRUD, filters
8. `lib/context/UIContext.tsx` — panel open state, active view, undo stack
9. `app/(app)/dashboard/page.tsx` — placeholder (stats shell, no data yet)

## Decisions made
- Using legacy Supabase JWT keys (eyJ...) — REST API requires JWT format, not new sb_publishable_ format
- "Automatically expose new tables" disabled — tables not accessible via REST API directly (SQL Editor only)
- No LODESTAR-TESTING-PROMPT.md — .claude/rules/testing.md is auto-loaded and covers all testing discipline
- No co-author tags on commits
- `components/ui/**` excluded from coverage — shadcn library code, not application code
- Coverage thresholds set to Phase 1 values (70/70/65), will ratchet up after each phase
- Callback uses `next=` query param for routing after OAuth — clean separation between signup and password-reset flows
- `/reset-password` excluded from middleware's authenticated-user redirect — recovery session must reach the page

## Known issues / blockers
- Next.js 16.2.6 installed (create-next-app@latest) vs Next.js 14 specified in CLAUDE.md — `middleware.ts` shows deprecation warning ("use proxy instead"). Build succeeds. Will rename to `proxy.ts` when confirmed the API is identical.

## Test status
- `npm run type-check`: PASS (0 errors)
- `npm test`: PASS (3 files, 27 tests)
- `npm run test:coverage`: PASS — Lines 100%, Functions 100%, Branches 100%
- `npm run build`: PASS (1 warning: middleware deprecation, non-breaking)
- Phase 1 threshold (Lines ≥ 70%, Functions ≥ 70%, Branches ≥ 65%): MET
