# lodestar

**Navigate what matters.**

A focused task management app built with Next.js 14, Supabase, and Claude AI.

---

## Stack

- **Next.js 14** (App Router, TypeScript strict mode)
- **Tailwind CSS** + shadcn/ui + @tabler/icons-react
- **Supabase** — Postgres + Auth (email/password + Google OAuth)
- **Anthropic API** — claude-sonnet-4-6
- **@dnd-kit** — drag and drop
- **Chart.js** + react-chartjs-2
- **next-themes** — light/dark, persisted in DB
- **Vitest** + React Testing Library

## Getting started

```bash
npm install
cp .env.example .env.local  # fill in your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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

## Scripts

```bash
npm run dev           # start dev server
npm run build         # production build
npm run type-check    # tsc --noEmit
npm run test          # vitest run
npm run test:watch    # vitest watch
npm run test:coverage # coverage report
npm run lint          # eslint
```
