# Lodestar — Progress

## Current phase
Phase 1 — Foundation (in progress — remaining items tracked in PHASE1ROADMAP.md)

**Phase 2 does not begin until all PHASE1ROADMAP prompts are complete.**

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

## In progress
Phase 1 remaining items — see PHASE1ROADMAP.md for full prompts.

Uncommitted Phase 2 foundation work (app shell, contexts, lib helpers) exists on
disk but is NOT committed. Do not build Phase 2 features until Phase 1 is complete.

## Next task
Phase 1 — PHASE1ROADMAP.md in order:
1. ~~P1.1 — Error pages + broken nav stubs (/matrix, /projects, /settings)~~ ✓ Complete
2. P1.2 — Toast notification system
3. P1.3 — Settings layout & navigation
4. P1.4 — Profile settings (display name, avatar upload)
5. P1.5 — Account settings (email, password, delete account)
6. P1.6 — Workspace settings (name, color, timezone, end-of-day)
7. P1.7 — Keyboard shortcut foundation + Q quick capture
8. P1.8 — Undo toast integration (after Phase 2 TaskRow exists)
9. P1.9 — Keyboard reference sheet (after Phase 2 complete)
10. P1.10 — Manual auth + RLS verification (browser testing, no code)
11. P1.11 — Phase 1 final checklist

Phase 2 begins only after P1.11 passes.

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

## Known issues / one-time setup required

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

## Test status
- `npm run type-check`: PASS (0 errors)
- `npm run type-check`: PASS (0 errors)
- `npm test`: PASS (13 files, 124 tests)
- Phase 1 threshold (Lines ≥ 70%, Functions ≥ 70%, Branches ≥ 65%): MET
