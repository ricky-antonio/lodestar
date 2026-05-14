# Lodestar — Progress

## Current phase
Phase 1 — Foundation

## Completed
- Pre-build setup: Supabase (18 tables, RLS, triggers, constraints all verified), Google OAuth, Anthropic API, Upstash Redis
- Next.js 14 scaffold with full dependency stack (Tailwind, shadcn/ui, dnd-kit, Chart.js, Vitest, RTL)
- `lib/types.ts` — all TypeScript interfaces for every DB table + AppError, FilterState, TaskWithRelations
- `lib/utils.ts` — cn() helper
- `lib/supabase/client.ts` — browser Supabase client
- `lib/supabase/server.ts` — SSR Supabase client (cookie-based)
- `middleware.ts` — session refresh, expired-session detection (?reason=expired), route protection
- `tests/mocks/supabase.ts` — shared Supabase mock (single source of truth)
- `tests/mocks/anthropic.ts` — shared Anthropic mock with success + error helpers
- `.claude/rules/testing.md` — full testing discipline rules added

## In progress
- Nothing — ready for next task

## Next task
Build auth pages and callback route:
1. `app/(auth)/callback/route.ts` — exchange OAuth code, create workspace on first login, redirect to /dashboard
2. `app/(auth)/login/page.tsx` — email/password + Google OAuth
3. `app/(auth)/signup/page.tsx` — email/password + Google OAuth, redirects to /verify-email
4. `app/(auth)/verify-email/page.tsx` — resend with 60s cooldown
5. `app/(auth)/forgot-password/page.tsx` — always shows generic message
6. `app/(auth)/reset-password/page.tsx` — token in URL, success → /login after 2s

## Decisions made
- Using legacy Supabase JWT keys (eyJ...) not new sb_publishable_/sb_secret_ format — REST API requires JWT format
- "Automatically expose new tables" disabled in Supabase — tables require explicit grants to be accessible via REST API
- No LODESTAR-TESTING-PROMPT.md needed — .claude/rules/testing.md is auto-loaded and covers all testing discipline
- No co-author tags on commits

## Known issues / blockers
- None

## Test status
- `npm run type-check`: passing (0 errors)
- `npm test`: no tests written yet (no lib logic to test — types and clients are excluded from coverage)
- `npm run build`: not yet run this session
- Coverage: not yet measured — Phase 1 threshold is Lines ≥ 70%, Functions ≥ 70%, Branches ≥ 65%
