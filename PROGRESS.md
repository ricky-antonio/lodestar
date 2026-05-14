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
- `middleware.ts` — session refresh, expired-session detection (?reason=expired), route protection
- `tests/mocks/supabase.ts` — shared Supabase mock (single source of truth)
- `tests/mocks/anthropic.ts` — shared Anthropic mock with success + error helpers
- `tests/lib/utils.test.ts` — 6 tests, all passing
- `.claude/rules/testing.md` — full testing discipline rules added
- Session management system: Required Reading block in CLAUDE.md, PROGRESS.md handoff

## In progress
- Nothing — ready for next task

## Next task
Build auth routes (`app/(auth)/` group):
1. `app/(auth)/callback/route.ts` — exchange OAuth code, create workspace on first login, redirect to /dashboard
2. `app/(auth)/login/page.tsx` — email/password + Google OAuth, don't clear email on error, resend link for unverified
3. `app/(auth)/signup/page.tsx` — email/password + confirm + Google OAuth, redirects to /verify-email
4. `app/(auth)/verify-email/page.tsx` — resend with 60s cooldown, "Wrong email? Go back" link
5. `app/(auth)/forgot-password/page.tsx` — always shows generic message (never leak email existence)
6. `app/(auth)/reset-password/page.tsx` — token in URL, success → /login after 2s, expired token message

## Decisions made
- Using legacy Supabase JWT keys (eyJ...) — REST API requires JWT format, not new sb_publishable_ format
- "Automatically expose new tables" disabled — tables not accessible via REST API directly (SQL Editor only)
- No LODESTAR-TESTING-PROMPT.md — .claude/rules/testing.md is auto-loaded and covers all testing discipline
- No co-author tags on commits
- `components/ui/**` excluded from coverage — shadcn library code, not application code
- Coverage thresholds set to Phase 1 values (70/70/65), will ratchet up after each phase

## Known issues / blockers
- Next.js 16.2.6 installed (create-next-app@latest) vs Next.js 14 specified in CLAUDE.md — `middleware.ts` shows deprecation warning ("use proxy instead"). Build succeeds. Will rename to `proxy.ts` when confirmed the API is identical.

## Test status
- `npm run type-check`: PASS (0 errors)
- `npm test`: PASS (1 file, 6 tests)
- `npm run test:coverage`: PASS — Lines 100%, Functions 100%, Branches 100% (only lib/utils.ts in scope)
- `npm run build`: PASS (1 warning: middleware deprecation, non-breaking)
- Phase 1 threshold (Lines ≥ 70%, Functions ≥ 70%, Branches ≥ 65%): MET
