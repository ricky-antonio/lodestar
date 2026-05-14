# Pre-Build Setup & API Verification

Complete all steps here before writing any app code. Each section ends with a verification test.

---

## 1. Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Name it `lodestar-dev` (keep production as a separate project later)
3. Choose a region close to you, set a strong DB password
4. Wait for provisioning (~2 min)

**Collect these values** (Settings → API):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   ← never expose client-side
```

### Apply the schema
In Supabase → SQL Editor, run all SQL from `.claude/schema.md` in this order:
1. `create table workspaces`
2. `create table workspace_members`
3. `create table profiles` + trigger
4. `create table projects`
5. `create table labels`
6. `create table tasks`
7. All junction tables (`task_labels`, `task_dependencies`, `task_links`, `task_watchers`)
8. `create table task_comments`
9. `create table activity_log`
10. `create table time_entries`
11. `create table my_day`
12. `create table saved_filters`
13. `create table templates`
14. `create table notifications`
15. `create table ai_usage`
16. All triggers (`update_updated_at` function + three triggers)
17. All check constraints
18. `alter table ... enable row level security` for every table
19. All RLS policies

### Configure Auth
Supabase → Authentication → URL Configuration:
```
Site URL:               http://localhost:3000
Redirect URLs:          http://localhost:3000/auth/callback
                        http://localhost:3000/**
```

### Create avatars storage bucket
Supabase → Storage → New bucket:
- Name: `avatars`
- Public: yes
- Then run the storage RLS policy from `.claude/schema.md`

**Verify Supabase:**
```sql
-- Run in SQL Editor — should return all table names
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
```
Expected: 18 tables listed.

---

## 2. Google OAuth

### Google Cloud Console
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project: `lodestar`
3. APIs & Services → OAuth consent screen
   - User Type: External
   - App name: Lodestar
   - Support email: your email
   - Save and continue through all steps
4. APIs & Services → Credentials → Create Credentials → OAuth Client ID
   - Application type: Web application
   - Name: `Lodestar Dev`
   - Authorised JavaScript origins: `http://localhost:3000`
   - Authorised redirect URIs: `https://[YOUR_SUPABASE_PROJECT].supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret

### Wire up in Supabase
Supabase → Authentication → Providers → Google:
- Enable Google provider
- Paste Client ID and Client Secret
- Save

**Verify Google OAuth:**
The actual test happens once the app is scaffolded — just confirm the credentials are saved in Supabase before proceeding.

---

## 3. Anthropic API

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. API Keys → Create Key → name it `lodestar-dev`
3. Copy the key (shown once)

```
ANTHROPIC_API_KEY=sk-ant-...
```

**Verify Anthropic (quick curl test):**
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 32,
    "messages": [{"role": "user", "content": "Reply with: API OK"}]
  }'
```
Expected response contains `"API OK"` in the content.

---

## 4. Vercel KV (rate limiting)

Rate limiting requires Vercel KV. Two options:

**Option A — Vercel (recommended, free tier available):**
1. Push repo to GitHub
2. Import to Vercel
3. Vercel dashboard → Storage → Create → KV Database → name it `lodestar-kv`
4. Connect to your project
5. Vercel auto-adds these env vars to your project:
   ```
   KV_URL=
   KV_REST_API_URL=
   KV_REST_API_TOKEN=
   KV_REST_API_READ_ONLY_TOKEN=
   ```
6. Download them locally: Vercel dashboard → Settings → Environment Variables → copy to `.env.local`

**Option B — Upstash directly (if not deploying to Vercel):**
1. Go to [console.upstash.com](https://console.upstash.com) → Create Database → Redis
2. Region: closest to you
3. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
4. Change import in AI routes from `@vercel/kv` to `@upstash/redis`

> Note: `@vercel/kv` is a thin wrapper around Upstash. If you might deploy outside Vercel, use `@upstash/redis` directly to avoid vendor lock-in.

---

## 5. `.env.local` (final file)

Create at project root after scaffolding:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# From Vercel KV or Upstash:
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

`.env.local` must never be committed. Confirm `.gitignore` includes it (Next.js scaffolds this by default).

---

## 6. RLS two-account verification

After the app is running with auth:
1. Create account A (email/password)
2. Create account B (different email)
3. Log in as A, create a project and several tasks
4. Log in as B — verify A's workspace, projects, and tasks are completely invisible
5. Try to fetch A's data directly via the Supabase client as B — should return empty arrays, not errors
6. Repeat for comments, labels, and time entries

This must pass before marking Phase 1 complete.

---

## Checklist

- [ ] Supabase project created, schema applied (18 tables)
- [ ] RLS enabled on all tables, all policies applied
- [ ] `avatars` storage bucket created and public
- [ ] Auth redirect URLs configured in Supabase
- [ ] Google OAuth configured in Google Cloud Console
- [ ] Google OAuth wired up in Supabase
- [ ] Anthropic API key created and verified with curl test
- [ ] Vercel KV (or Upstash) provisioned
- [ ] `.env.local` populated with all values
- [ ] `.env.local` is in `.gitignore`
