Here's the full sequence. Each service depends on the previous one in places, so follow the order.

Step 1 — Supabase
Create the project:

Go to supabase.com → Sign in → New project
Name: lodestar-dev
Database password: generate a strong one and save it somewhere safe
Region: pick the one closest to you
Wait ~2 minutes for provisioning
Collect your keys:
Go to Settings → API. You need three values — save them, you'll use them in .env.local:


NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY    ← keep this secret, never expose client-side
Apply the schema:
Go to SQL Editor → New query. Run the entire contents of .claude/schema.md in order — the tables, triggers, constraints, then all the RLS policies. You can paste it all in one go or section by section.

After running, verify with this query — you should see 18 tables:


select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
Configure auth redirect URLs:
Authentication → URL Configuration:


Site URL:        http://localhost:3000
Redirect URLs:   http://localhost:3000/auth/callback
Create the avatars storage bucket:
Storage → New bucket:

Name: avatars
Public: on
Then go to SQL Editor and run the storage RLS policy from the bottom of .claude/schema.md

Step 2 — Google OAuth
Google Cloud Console:

Go to console.cloud.google.com → New project → name it lodestar
APIs & Services → OAuth consent screen
User type: External
App name: Lodestar
Support email: your email
Click through the remaining screens, no other changes needed

APIs & Services → Credentials → Create Credentials → OAuth Client ID
Application type: Web application
Name: Lodestar Dev
Authorised JavaScript origins: http://localhost:3000
Authorised redirect URIs: https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback (your project ref is the subdomain in your Supabase URL)
Copy the Client ID and Client Secret

Wire up in Supabase:
Authentication → Providers → Google → Enable → paste Client ID and Client Secret → Save

Step 3 — Anthropic API key
Go to console.anthropic.com → API Keys → Create Key
Name: lodestar-dev
Copy it immediately — it's only shown once

ANTHROPIC_API_KEY=sk-ant-...
Quick verify (run in your terminal):


curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_KEY_HERE" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-4-20250514","max_tokens":16,"messages":[{"role":"user","content":"Reply: API OK"}]}'
You should see "API OK" in the response. If you get a 401, the key wasn't copied correctly.

Step 4 — Upstash Redis (rate limiting)
Go to console.upstash.com → Create Database → Redis
Name: lodestar-kv
Type: Regional → pick the same region as your Supabase project
Click Create
From the database detail page, copy:


UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

Step 5 — GitHub repo
Go to github.com → New repository
Name: lodestar
Private
No README, no .gitignore (Next.js will create these)
Copy the repo URL — you'll push to it after scaffolding
