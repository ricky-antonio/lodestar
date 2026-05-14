# Testing

## Philosophy
Tests give confidence when adding features — not just numbers on a coverage report. Three layers:
1. **Unit** — pure logic in `lib/`, no React, no network
2. **Component** — what the user sees/interacts with (React Testing Library)
3. **Integration** — full API route behavior with mocked external services

## Rules (no exceptions)
1. Write tests for a module before moving to the next one — in the same session, not later
2. Never mock the module under test — only mock its dependencies
3. Test behaviour, not implementation — renaming a function must not break tests
4. A failing test is never fixed by deleting it — fix the code or the assertion
5. `vi.useFakeTimers()` for anything time-dependent — never real `setTimeout` in tests
6. Run `npm test` after writing each test file — fix all failures before creating the next file
7. Never create inline mocks — always import from `tests/mocks/supabase.ts` or `tests/mocks/anthropic.ts`
8. Do not skip writing tests under any circumstances — not for speed, not because code "seems simple", not to add later. Tests are part of the definition of done for every file.

## Authoring order (always follow this sequence)
```
types → lib function → lib test (npm test) → component → component test (npm test)
```
Never write a component before its underlying lib function is tested. Never write a lib function without testing it before moving on.

## Per-category test requirements

**AI routes** (`app/api/ai/*`): every handler must have an integration test in `tests/api/`. Mock the Anthropic fetch call — never call the real API. Cover:
- Missing/invalid input → 400
- Valid input → 200 with correct response shape
- Anthropic failure → correct error handling
- Rate limit hit → 429

**Auth functions**: any function that calls `supabase.auth.*` must have a test covering the happy path and at least one failure path.

**Optimistic UI**: any component that performs an optimistic update must have a test that simulates a DB failure and verifies the UI reverts to the previous state.

## Setup

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['lib/**', 'components/**', 'app/api/**'],
      exclude: ['lib/supabase/client.ts', 'lib/supabase/server.ts'],
      thresholds: { lines: 80, functions: 80, branches: 75 },
    },
  },
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
})
```

`tests/setup.ts`:
```ts
import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))
```

## Mocks

**Supabase** (`tests/mocks/supabase.ts`):
```ts
export const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn(),
  auth: { getUser: vi.fn(), signInWithPassword: vi.fn(), signUp: vi.fn(), signOut: vi.fn() },
}
vi.mock('@/lib/supabase/client', () => ({ createClient: () => mockSupabase }))
vi.mock('@/lib/supabase/server', () => ({ createServerClient: () => mockSupabase }))
```

**Anthropic** (`tests/mocks/anthropic.ts`):
```ts
export const mockAnthropicResponse = (content: string) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ content: [{ type: 'text', text: content }] }),
  })
}
```

Always `vi.clearAllMocks()` in `beforeEach`.

## Coverage thresholds per phase

| Phase | Lines | Functions | Branches |
|-------|-------|-----------|----------|
| After Phase 1 | 70% | 70% | 65% |
| After Phase 2 | 75% | 75% | 70% |
| After Phase 3 | 80% | 80% | 75% |
| After Phase 4 | 80% | 80% | 75% |
| After Phase 5 | 85% | 85% | 80% |

## npm scripts
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage",
"test:ui": "vitest --ui",
"type-check": "tsc --noEmit"
```

## End of session checklist
Run all four before ending any session. All must pass — do not commit a broken state.
```bash
npm run type-check     # zero TypeScript errors
npm test               # all tests pass
npm run test:coverage  # coverage above phase threshold
npm run build          # production build succeeds
```

## What a correct session looks like
1. Read CLAUDE.md — confirm phase and scope
2. Create `lib/example.ts` with pure functions
3. Create `tests/lib/example.test.ts` → run `npm test` → all pass
4. Create `components/Example.tsx`
5. Create `tests/components/Example.test.tsx` → run `npm test` → all pass
6. Run end of session checklist — all pass
7. Commit
