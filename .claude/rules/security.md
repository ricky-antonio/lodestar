# Security

## RLS verification
Before calling any phase complete — test with two real accounts. Sign in as User A, confirm User B's workspaces/projects/tasks are completely invisible. Passing tests are not sufficient. RLS must be manually verified with real sessions.

## Input validation
Validate all inputs server-side in every API route, even when the form already validates client-side. Never trust the client for anything that touches the database.

## Rate limiting AI routes
Every `/api/ai/*` route must be rate-limited or a single user can exhaust Anthropic credits in minutes.

```ts
import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '1m'),
})

// In each AI route handler:
const { success } = await ratelimit.limit(userId)
if (!success) return Response.json({ message: 'Too many requests' }, { status: 429 })
```

## Content sanitization
Any user content rendered as HTML must be sanitized:
```ts
import DOMPurify from 'dompurify'
const clean = DOMPurify.sanitize(userContent)
```
Apply to: task description rendering, comment rendering, any `dangerouslySetInnerHTML`.

## Account deletion
Delete user via `supabase.auth.admin.deleteUser(userId)` in a **server route handler** only. Requires service role key. Never call admin APIs client-side.

## Auth rules
- Never leak whether an email is registered (forgot password always shows generic message)
- Google OAuth + email/password same address → Supabase merges automatically — test this explicitly
- Reset links used twice → second attempt shows "expired" message
