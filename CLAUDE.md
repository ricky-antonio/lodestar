# Lodestar

## Required reading
Before writing any code, read these files in order:
1. CLAUDE.md (this file)
2. `.claude/rules/testing.md` — testing discipline, shared mocks, end-of-session checklist
3. `.claude/phases/` — read the file for the current phase only
4. `PROGRESS.md` — current phase, last completed task, next task

Confirm you have read all four by stating: the current phase, the last completed task, and the next task to build. Do not write a single line of code until this confirmation is complete.

---

**Tagline:** Navigate what matters.
**Status:** Phase 1 — Foundation

---

## Brand
- Name: `lodestar` (all lowercase)
- Wordmark: Inter, cerulean `#00B6EC` on dark / `#005F7D` on light
- Icon: minimal four-pointed north star, slightly elongated vertically, cerulean
- Voice: purposeful, calm, direct — never cute or playful

---

## Stack
- Next.js 14 (App Router) + TypeScript strict mode
- Tailwind CSS + shadcn/ui + `@tabler/icons-react`
- Supabase (Postgres + Auth) — email/password + Google OAuth
- Anthropic API — `claude-sonnet-4-6`
- @dnd-kit (drag and drop)
- Chart.js + react-chartjs-2
- next-themes (dark mode, default light, stored in `profiles.theme`)
- Vitest + React Testing Library
- GitHub Actions (CI)

---

## Environment variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## Detailed references
| Topic | File |
|-------|------|
| Pre-build setup & API verification | [.claude/setup.md](.claude/setup.md) |
| Database schema (canonical) | [.claude/schema.md](.claude/schema.md) |
| Design system | [.claude/design.md](.claude/design.md) |
| Architecture & patterns | [.claude/architecture.md](.claude/architecture.md) |
| Code standards | [.claude/rules/code.md](.claude/rules/code.md) |
| Testing rules | [.claude/rules/testing.md](.claude/rules/testing.md) |
| Security rules | [.claude/rules/security.md](.claude/rules/security.md) |
| Phase 1 — Foundation | [.claude/phases/1-foundation.md](.claude/phases/1-foundation.md) |
| Phase 2 — Views | [.claude/phases/2-views.md](.claude/phases/2-views.md) |
| Phase 3 — AI | [.claude/phases/3-ai.md](.claude/phases/3-ai.md) |
| Phase 4 — Productivity | [.claude/phases/4-productivity.md](.claude/phases/4-productivity.md) |
| Phase 5 — Polish | [.claude/phases/5-polish.md](.claude/phases/5-polish.md) |

---

## Scaffold command (run once, then configure env)
```bash
npx create-next-app@latest lodestar --typescript --tailwind --app --no-src-dir
cd lodestar

npm install \
  @supabase/supabase-js @supabase/ssr \
  @anthropic-ai/sdk \
  @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities \
  @tabler/icons-react \
  chart.js react-chartjs-2 \
  next-themes \
  @tanstack/react-virtual \
  dompurify \
  @upstash/ratelimit @upstash/redis \
  browser-image-compression

npm install -D \
  @types/dompurify \
  vitest @vitest/coverage-v8 @vitest/ui \
  @testing-library/react @testing-library/user-event @testing-library/jest-dom \
  jsdom @vitejs/plugin-react

npx shadcn@latest init
# Choose: neutral base color, CSS variables yes

npx shadcn@latest add \
  button badge input textarea \
  dropdown-menu dialog popover tooltip \
  separator scroll-area avatar skeleton collapsible

npx @sentry/wizard@latest -i nextjs
# Run this after the basic shell is stable, not during initial scaffold
```

> Note: Using `@upstash/redis` directly instead of `@vercel/kv` to avoid Vercel vendor lock-in. Import: `import { Redis } from '@upstash/redis'`.

---

## Key decisions (document all in DECISIONS.md)
- Fractional indexing for task position — float, average between neighbours on drag
- Context per domain, not Zustand — four contexts cover complexity without global state library
- `workspace_id` on every table from day one — collaboration unlock requires no migrations
- RLS scoped to `workspace_members` — adding a team member instantly grants correct access
- Labels are workspace-wide — one shared pool, coherent filtering across My Day, Matrix, Dashboard, Inbox
- `task_links` bidirectional via single row — always query `task_id = X OR linked_task_id = X`
- Theme stored in `profiles.theme` — persists across devices, synced via Supabase
- Quick capture saves immediately, then extracts date async — never blocks on AI
- Desktop-first, mobile-responsive — one breakpoint at 768px. Sidebar → bottom nav, detail panel → full-screen, board defaults to list on mobile
- `task_comments` and `time_entries` carry `workspace_id` — direct RLS, no join needed
- `task_watchers` and `notifications` tables created now — collaboration-ready shell, not yet surfaced

---

## Collaboration unlock path (v2, no migrations needed)
1. Allow multiple `workspace_members` per workspace
2. Build invite flow (send invite by email, create `workspace_members` row on accept)
3. Surface `notifications` table — already has type, actor, payload, read_at
4. Surface `task_watchers` — auto-watch tasks you're assigned or comment on
5. Add `@mention` parsing to comments (body is plain text now, easy to extend)
6. RLS already correct — adding a member instantly exposes the right data and nothing else

---

## Non-goals for v1
No real-time collaboration · No email notifications · No file attachments · No GitHub OAuth · No native mobile app (responsive web only) · No public project sharing
