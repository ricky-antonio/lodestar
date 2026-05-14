# Phase 5 — Polish

## What to build

- [ ] Dashboard with Chart.js charts: completion rate (line), time logged by project (doughnut), workload (bar)
- [ ] Streak and completion stats (GitHub-style heatmap, 12 weeks)
- [ ] Due date reminders (in-app)
- [ ] Overdue task alerts
- [ ] Daily agenda view
- [ ] Full keyboard shortcut set (see below)
- [ ] Context-aware empty states for every view
- [ ] Workspace settings polish
- [ ] Profile settings polish
- [ ] `DECISIONS.md` written and current

## Full keyboard shortcut set

```
?           Keyboard shortcut reference sheet
C           New task (quick capture)
Q           Quick capture floating input
E           Edit focused/selected task
/           Focus search input
Escape      Close any open panel/modal/menu
J / ↓       Next task in detail panel
K / ↑       Previous task in detail panel
1           Set priority: Urgent
2           Set priority: High
3           Set priority: Medium
4           Set priority: Low
]           Move task to next status
[           Move task to previous status
M           Add/remove from My Day
S           Snooze task
Cmd+K       Open command palette
Cmd+Z       Undo last destructive action
```

Shortcuts disabled when focus is inside a text input or textarea.

## Context-aware empty states

| Context | Copy |
|---------|------|
| Board "To do" | "Nothing here yet — add a task to get started" |
| Board "Done" | "Nothing completed yet — you've got this" |
| My Day (morning) | "What are you working on today? Add tasks to your day." |
| My Day (evening, >5 done) | "Strong day. {N} tasks completed." |
| Inbox | "Inbox zero. Nice work." |
| Search no results | "No tasks match '{query}' — try different keywords" |
| Dashboard first load | "Complete your first task to start seeing stats" |

`EmptyState` props: `context`, `title`, `subtitle`, optional `action`.

## Tests to write (Phase 5)

**`components/dashboard/StatsCards.test.tsx`:**
- Correct counts for tasks due today, overdue, completed this week
- Overdue count turns red when > 0

**`components/layout/CommandPalette.test.tsx`:**
- Opens on Cmd+K
- Closes on Escape
- Search input filters tasks and projects
- Selecting a result navigates to correct route

## Pre-deploy checklist

- [ ] RLS tested with two accounts
- [ ] All env vars in Vercel for all environments
- [ ] Supabase redirect URLs configured for production domain
- [ ] Google OAuth redirect URI updated for production domain
- [ ] Sentry DSN set in production env vars
- [ ] Rate limiting configured and tested
- [ ] `npm run build` passes locally with no type errors

## Coverage target after Phase 5
Lines ≥ 85% · Functions ≥ 85% · Branches ≥ 80%
