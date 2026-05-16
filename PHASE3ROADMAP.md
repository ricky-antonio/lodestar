# Phase 3 — AI Features Roadmap

> **PREREQUISITE: All PHASE2ROADMAP.md prompts must be complete (including RLS
> verification and Phase 2 close-out) before starting this file. Check PROGRESS.md
> — if Phase 2 is still in progress, stop here.**

Each prompt is self-contained. Paste it into a fresh context window. The required
reading step keeps Claude aligned with project rules.

Run `npm test` and `npm run type-check` at the end of every prompt. Fix all
failures before moving on.

---

## Phase 2 extension decision

**Not extended.** All Phase 2 feature prompts (0–16) are complete. The following
are the only remaining Phase 2 items before close:
- RLS two-account verification (manual browser test — no code)
- Phase 2 close-out checklist (PROMPT 17)

Phase 3 infrastructure (Anthropic client, rate limiting, AI lib structure) is
intentionally placed as P3.0 rather than appended to Phase 2 — it belongs with
the phase that uses it.

---

## Known gaps entering Phase 3

| Gap | Impact | Handled in |
|-----|--------|------------|
| No rate limiting on API routes | Any AI route can exhaust Anthropic credits | P3.0 |
| No Anthropic client helper | Every AI route would re-instantiate the SDK | P3.0 |
| Description field is a plain `<textarea>` | Slash commands need keyboard intercept + popover | P3.3 |
| Dashboard shows stat numbers only | Weekly digest and advisor need a surface | P3.5 |
| Matrix view is "coming soon" placeholder | Eisenhower matrix is a Phase 4 feature | Phase 4 |

---

## Dependency map

```
P3.0   AI infrastructure (client, rate limit, error pattern)   ← do first, all AI depends on this
P3.1   Natural language task creation                          ← needs P3.0
P3.2   Task breakdown                                          ← needs P3.0
P3.3   Description editor + slash commands                     ← needs P3.0, blocks P3.4
P3.4   AI description writer (/ai slash command)               ← needs P3.3
P3.5   Weekly digest                                           ← needs P3.0
P3.6   Priority suggester                                      ← needs P3.0
P3.7   Stale task detector                                     ← needs P3.0
P3.8   Workload advisor                                        ← needs P3.0
P3.9   Meeting agenda builder                                  ← needs P3.0
P3.10  Smart daily scheduler                                   ← needs P3.0, P3.2
P3.11  Phase 3 close-out checklist                            ← do last
```

---

## PROMPT P3.0 — AI infrastructure

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/3-ai.md, PROGRESS.md, and PHASE3ROADMAP.MD
in that order. Confirm: current phase, last completed task, next task.

Before any AI feature is built, establish the shared infrastructure all AI routes
will use. Do not build any user-facing feature in this prompt.

Read .claude/rules/security.md — pay close attention to the rate limiting section.
Read CLAUDE.md environment variables — ANTHROPIC_API_KEY and Upstash vars are set.

Step 1 — `lib/ai/client.ts`:
  Anthropic SDK singleton (instantiated once, imported by all AI lib functions).

  import Anthropic from '@anthropic-ai/sdk'
  export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  Model constant:
  export const AI_MODEL = 'claude-sonnet-4-6'

Step 2 — `lib/rate-limit.ts`:
  Upstash rate limiter wrapper for AI routes.

  import { Ratelimit } from '@upstash/ratelimit'
  import { Redis } from '@upstash/redis'

  export const aiRatelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, '1m'),
    analytics: false,
  })

  Export a helper used inside route handlers:
  checkRateLimit(userId: string): Promise<{ limited: boolean; response: Response | null }>
    If limited: returns { limited: true, response: Response.json({ message: 'Too many requests' }, { status: 429 }) }
    If not limited: returns { limited: false, response: null }

Step 3 — Standard AI route pattern (document, do not build a file):
  Every /api/ai/* route handler must follow this exact sequence:
  1. Get userId from Supabase session (getUser()) — return 401 if not authed
  2. Call checkRateLimit(userId) — return 429 response if limited
  3. Validate input — return 400 if invalid
  4. Call Anthropic in try/catch — return 500 with { message } on failure
  5. Return 200 with structured result

Step 4 — `lib/ai/parse.ts`:
  JSON extraction helper used by all AI functions.

  extractJSON<T>(text: string): T
    Strips markdown fences (```json ... ```) if present, then JSON.parse.
    Throws with message "AI returned invalid JSON" on failure.

Step 5 — Tests:
  tests/lib/ai/parse.test.ts:
    - Parses bare JSON string → correct object
    - Strips ```json ... ``` fences before parsing
    - Throws on malformed JSON
    - Strips ``` ... ``` fences (no language tag)

  tests/lib/rate-limit.test.ts:
    - checkRateLimit returns limited=false when under limit (mock Ratelimit.limit)
    - checkRateLimit returns limited=true with 429 response when over limit

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark AI infrastructure complete, next = Natural language task creation.
```

---

## PROMPT P3.1 — Natural language task creation

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/3-ai.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

Build the natural language task creation flow: user types a plain-English description,
AI returns structured fields, user confirms before the task is saved.

Read .claude/rules/security.md (rate limiting required on all AI routes).

Step 1 — `lib/ai/tasks.ts` — createTaskFromPrompt:

  async function createTaskFromPrompt(prompt: string): Promise<AITaskPreview>

  AITaskPreview = {
    title: string
    description?: string
    priority: TaskPriority          // 'urgent' | 'high' | 'medium' | 'low'
    due_date?: string               // YYYY-MM-DD or null
    estimated_mins?: number | null
  }

  System prompt (keep concise):
    "You are a task extraction assistant. Given a plain-English description of a task,
    return a JSON object with these fields: title (string, required), description
    (string, optional), priority ('urgent'|'high'|'medium'|'low'), due_date
    (YYYY-MM-DD or null), estimated_mins (number or null). Return only valid JSON,
    no markdown."

  Use anthropic and AI_MODEL from lib/ai/client.ts.
  Use extractJSON from lib/ai/parse.ts.
  On JSON parse failure: retry once. Throw after two failures.

Step 2 — `app/api/ai/create-task/route.ts` (POST):
  Body: { prompt: string }
  Follow the standard AI route pattern from P3.0:
    1. Auth check → 401
    2. Rate limit → 429
    3. Validate: prompt must be a non-empty string → 400
    4. Call createTaskFromPrompt(prompt) → return AITaskPreview
    5. Catch errors → 500 with { message }

Step 3 — `components/ai/AICommandBar.tsx`:
  A floating input that can be opened via a button in the Tasks page header or
  via the keyboard shortcut Alt+N (register in AppShortcuts).

  Behavior:
    - Textarea (auto-focused on open), placeholder "Describe a task in plain English…"
    - Submit button + Ctrl+Enter shortcut
    - While loading: spinner on button, textarea disabled
    - On success: show AIPreviewCard (see below)
    - On error: inline error message; user can edit and retry

  AIPreviewCard (inline, not a modal):
    Shows the returned fields in a read-only card:
      Priority badge | Title | Description (if any) | Due date (if any) | Est. mins (if any)
    Two buttons: "Create task" (calls useTasks().addTask with preview values + activeProject.id)
    and "Cancel" (clears and hides preview)
    On "Create task": closes AICommandBar, shows success toast

Step 4 — Wire into Tasks page:
  Add an "AI" button to the Tasks page header (next to "New task").
  Clicking opens AICommandBar as an inline panel below the page header.

Step 5 — Tests:
  tests/lib/ai/tasks.test.ts:
    - createTaskFromPrompt sends correct system prompt and user message to Anthropic
    - Parses valid AI JSON response into AITaskPreview
    - Retries once on JSON parse failure, throws after two failures
    - Returns correct structure with all optional fields present

  tests/api/ai-create-task.test.ts:
    - 401 when not authenticated
    - 429 when rate limited (mock checkRateLimit)
    - 400 on missing prompt
    - 400 on empty string prompt
    - 200 with AITaskPreview on valid input (mock createTaskFromPrompt)
    - 500 with message on AI failure

  tests/components/ai/AICommandBar.test.tsx:
    - Input accepts text
    - Submit calls the AI endpoint
    - Preview card renders returned title, priority, due date
    - "Create task" button calls addTask with correct values
    - "Cancel" dismisses preview without saving
    - Shows error message on API failure

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark natural language task creation complete, next = Task breakdown.
```

---

## PROMPT P3.2 — Task breakdown

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/3-ai.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

Build "Break this down" — AI suggests 3–6 subtasks for a given task, user checks
which to keep, then confirms.

Step 1 — `lib/ai/tasks.ts` — add breakdownTask:

  async function breakdownTask(task: Task): Promise<AISubtaskSuggestion[]>

  AISubtaskSuggestion = { title: string; estimated_mins?: number | null }

  System prompt:
    "You are a task decomposition assistant. Given a task title and optional
    description, suggest 3 to 6 concrete subtasks needed to complete it. Return a
    JSON array of objects with: title (string, required), estimated_mins (number
    or null). Return only valid JSON, no markdown."

  User message: include task.title and task.description (if present).
  Use extractJSON. Validate result is an array of 3–6 items; throw otherwise.

Step 2 — `app/api/ai/breakdown/route.ts` (POST):
  Body: { taskId: string }
  Standard AI route pattern:
    1. Auth + rate limit
    2. Validate taskId present → 400
    3. Fetch task from Supabase (select title, description, workspace_id)
       Check workspace access via workspace_members → 404 if not found/not member
    4. Call breakdownTask(task)
    5. Return { subtasks: AISubtaskSuggestion[] }
    6. Catch → 500

Step 3 — `components/ai/AITaskBreakdown.tsx`:
  Triggered by a "Break this down" button in TaskDetail header (edit mode only).

  State: loading → subtasks list → confirmed

  While loading: spinner, button disabled.
  Once loaded: renders each suggestion as a checkbox row (all checked by default).
    Each row: title + estimated_mins badge (if present)
  Two buttons: "Add subtasks" (creates only checked items via createSubtask)
    and "Cancel" (dismisses without creating)
  On confirm: creates subtasks one by one, shows count toast, reloads SubtaskList.

Step 4 — Wire into TaskDetail:
  Add "Break this down" button to TaskDetail header (edit mode only, not create mode).
  When clicked: renders AITaskBreakdown inline below the header.

Step 5 — Tests:
  tests/lib/ai/tasks.test.ts (add):
    - breakdownTask sends correct prompt with task title and description
    - Returns array of 3–6 AISubtaskSuggestion objects
    - Throws if AI returns fewer than 3 or more than 6 items

  tests/api/ai-breakdown.test.ts:
    - 401 when not authenticated
    - 400 on missing taskId
    - 404 if task not found or user not in workspace
    - 200 with subtask array on success
    - 500 on AI failure

  tests/components/ai/AITaskBreakdown.test.tsx:
    - Renders loading state while fetching
    - Renders suggested subtasks as checkboxes (all checked by default)
    - Unchecking a subtask excludes it from confirmation payload
    - "Add subtasks" calls createSubtask for each checked item only
    - "Cancel" dismisses without calling createSubtask

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark task breakdown complete, next = Description editor + slash commands.
```

---

## PROMPT P3.3 — Description editor + slash command infrastructure

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/3-ai.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

The description field in TaskDetail is currently a plain <textarea>. Phase 3 needs
slash commands (/ai, /date, /task) inside it. This prompt upgrades the textarea to
support slash command interception — without replacing it with a full rich-text editor.

This is infrastructure only. The /ai command behavior is built in P3.4.

Approach: keep a <textarea> for input; intercept keydown for '/'; show a floating
command menu anchored to the cursor; dispatch the selected command.

Step 1 — `components/editor/SlashCommandMenu.tsx`:
  Props:
    open: boolean
    query: string         // text after the slash, updated as user types
    position: { top: number; left: number }
    onSelect: (command: SlashCommand) => void
    onClose: () => void

  SlashCommand = { id: 'ai' | 'date' | 'task'; label: string; description: string }

  Available commands:
    { id: 'ai',   label: '/ai',   description: 'Continue writing with AI' }
    { id: 'date', label: '/date', description: 'Insert a due date' }
    { id: 'task', label: '/task', description: 'Link a related task' }

  Filters commands by query (case-insensitive prefix match on label or description).
  Keyboard: ArrowUp / ArrowDown navigate; Enter selects; Escape closes.
  Renders as a small popover card (dark surface, matches design system).
  If no commands match query: renders "No commands" or closes.

Step 2 — `components/editor/SlashTextarea.tsx`:
  A drop-in replacement for the plain description textarea.
  Wraps <textarea> + <SlashCommandMenu>.

  Props:
    value: string
    onChange: (value: string) => void
    onCommand: (command: SlashCommand, triggerIndex: number) => void
    placeholder?: string
    rows?: number

  Behavior:
    - Renders a normal <textarea> visually identical to the existing one
    - On keydown '/': record the trigger index (cursor position), open the menu
    - As user continues typing after '/': update query to text between '/' and cursor
    - On command selected from menu:
        Strip the '/query' text from value (from triggerIndex to cursor)
        Call onCommand(command, triggerIndex) so the parent can handle the action
        Close the menu
    - On Escape or blur: close menu without triggering command
    - Menu position is anchored near the cursor (approximate — use a fixed offset
      from textarea top-left for simplicity; exact caret position is not required)

Step 3 — Replace description textarea in `components/tasks/TaskDetail.tsx`:
  Import SlashTextarea. Replace the plain <textarea> for description with
  <SlashTextarea>. Handle onCommand:
    - 'date': call openDetail / focus the DueDatePicker (or just open DueDatePicker
      via a ref — simplest is to call the DueDatePicker's open handler)
    - 'task': open the task dependency picker (TaskDependencies component already exists)
    - 'ai': set a local state flag `aiSlashActive = true` (P3.4 will use this)

Step 4 — Tests:
  tests/components/editor/SlashCommandMenu.test.tsx:
    - Renders all three commands when query is empty
    - Filters to matching commands as query changes
    - ArrowDown moves selection; Enter calls onSelect with correct command
    - Escape calls onClose without selecting
    - "No commands" shown when nothing matches

  tests/components/editor/SlashTextarea.test.tsx:
    - Typing '/' opens the command menu
    - Typing '/ai' filters to the AI command
    - Pressing Enter on a filtered command calls onCommand with that command
    - Escape closes the menu without calling onCommand
    - Normal typing (no slash) does not open the menu

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark description editor complete, next = AI description writer.
```

---

## PROMPT P3.4 — AI description writer (/ai slash command)

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/3-ai.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

Wire the /ai slash command to an API route that continues/expands the task
description using the current text as context.

Step 1 — `lib/ai/tasks.ts` — add continueDescription:

  async function continueDescription(title: string, currentText: string): Promise<string>

  System prompt:
    "You are a writing assistant for a task management app. Given a task title and
    partial description, continue or expand the description in a clear, concise,
    professional tone. Return only the continued text (not the original) — do not
    repeat the existing content. Maximum 3 sentences."

  Returns the continuation as a plain string (not JSON — use text content directly).

Step 2 — `app/api/ai/continue-description/route.ts` (POST):
  Body: { title: string; currentText: string }
  Standard AI route pattern:
    1. Auth + rate limit
    2. Validate: title must be non-empty string → 400
    3. Call continueDescription(title, currentText)
    4. Return { continuation: string }
    5. Catch → 500

Step 3 — Wire into TaskDetail's onCommand handler (P3.3 set aiSlashActive):
  When aiSlashActive = true:
    - Show inline loading state in the description area (spinner overlay or disabled)
    - Call /api/ai/continue-description with task.title + current description value
    - On success: append the continuation to the description value with a line break
    - On error: show inline error toast; revert to previous description
    - Reset aiSlashActive to false

Step 4 — Tests:
  tests/lib/ai/tasks.test.ts (add):
    - continueDescription sends correct title and currentText to Anthropic
    - Returns the text content from the AI response as a string

  tests/api/ai-continue-description.test.ts:
    - 401 when not authenticated
    - 400 on missing or empty title
    - 200 with { continuation } on valid input
    - 500 on AI failure

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark AI description writer complete, next = Weekly digest.
```

---

## PROMPT P3.5 — Weekly digest

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/3-ai.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

Build the weekly digest: AI generates a summary of wins, concerns, and focus for
next week based on current task data. Persisted in localStorage per calendar week.

Step 1 — `lib/ai/digest.ts`:

  WeeklyDigest = {
    wins: string[]         // completed/closed tasks this week, phrased as wins
    concerns: string[]     // overdue or high-priority tasks not started
    focus: string[]        // top 3 suggestions for next week
    generatedAt: string    // ISO timestamp
    weekKey: string        // 'YYYY-WW' (ISO week)
  }

  async function generateWeeklyDigest(tasks: Task[]): Promise<WeeklyDigest>

  Prepare context: from the tasks array, extract:
    - Completed this week (status=done, updated_at within last 7 days)
    - Overdue (due_date < today, status !== done)
    - High/urgent tasks not started (status=todo, priority in ['high', 'urgent'])
  Send a concise summary of these to the AI (titles only — never descriptions).

  System prompt:
    "You are a productivity coach. Given a summary of a user's tasks for the week,
    return a JSON object with: wins (array of 2–4 short strings celebrating completed
    work), concerns (array of 1–3 short strings about overdue or stalled work),
    focus (array of 3 strings suggesting priorities for next week). Keep each item
    under 15 words. Return only valid JSON."

  weekKey helper: getISOWeekKey(date: Date): string → 'YYYY-WW'

Step 2 — `app/api/ai/weekly-digest/route.ts` (POST):
  Standard AI route pattern.
  Body: (none — fetch tasks server-side from Supabase using auth user's workspace)
  Returns WeeklyDigest.

Step 3 — `lib/digest-cache.ts`:
  getStoredDigest(): WeeklyDigest | null
    Read from localStorage key 'lodestar:digest'. Return null if no entry or
    if weekKey !== current ISO week (stale).

  storeDigest(digest: WeeklyDigest): void
    Write to localStorage.

Step 4 — `components/dashboard/WeeklyDigest.tsx`:
  Rendered on the Dashboard page.
  On mount: check localStorage for a current-week digest (getStoredDigest).
    - If found: render it immediately (no API call).
    - If not found: show "Generate this week's digest" button.
  On button click: call /api/ai/weekly-digest, store result, render.
  While generating: spinner with "Analysing your week…" text.

  Layout:
    Three sections side by side (or stacked on mobile):
      🏆 Wins | ⚠ Concerns | 🎯 Focus for next week
    Each section: 2–4 bullet points
    Small "Regenerate" link in footer (clears cache, re-calls API)

Step 5 — Wire into Dashboard:
  Add <WeeklyDigest /> below the stat cards on app/(app)/dashboard/page.tsx.

Step 6 — Tests:
  tests/lib/ai/digest.test.ts:
    - generateWeeklyDigest sends task summary to Anthropic (mocked)
    - Parses AI response into WeeklyDigest shape
    - getISOWeekKey returns correct 'YYYY-WW' format

  tests/lib/digest-cache.test.ts:
    - getStoredDigest returns null when localStorage is empty
    - getStoredDigest returns null when stored weekKey is stale
    - getStoredDigest returns the digest when weekKey matches current week
    - storeDigest writes correct shape to localStorage

  tests/api/ai-weekly-digest.test.ts:
    - 401 when not authenticated
    - 429 when rate limited
    - 200 with WeeklyDigest shape on success
    - 500 on AI failure

  tests/components/dashboard/WeeklyDigest.test.tsx:
    - Renders "Generate" button when no stored digest
    - Shows spinner while generating
    - Renders wins/concerns/focus after successful generation
    - Loads from cache on mount without calling API

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark weekly digest complete, next = Priority suggester.
```

---

## PROMPT P3.6 — Priority suggester

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/3-ai.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

Build the priority suggester: AI reviews a batch of tasks and suggests reprioritisation
with reasoning. User sees a diff view and accepts individually or in bulk.

Step 1 — `lib/ai/tasks.ts` — add suggestPriorities:

  AIPrioritySuggestion = {
    taskId: string
    currentPriority: TaskPriority
    suggestedPriority: TaskPriority
    reason: string          // one sentence max
  }

  async function suggestPriorities(tasks: Task[]): Promise<AIPrioritySuggestion[]>

  Send task titles, due dates, and current priorities to AI (no descriptions —
  keep context window small). Ask for JSON array. Filter result to only include
  tasks where suggestedPriority !== currentPriority.

  System prompt:
    "You are a priority review assistant. Given a list of tasks with their current
    priorities and due dates, suggest updated priorities where appropriate.
    Return a JSON array of objects with: taskId, currentPriority, suggestedPriority,
    reason (one sentence). Only include tasks where you recommend a change."

Step 2 — `app/api/ai/suggest-priorities/route.ts` (POST):
  Body: { taskIds: string[] }
  Standard AI route pattern.
  Fetch tasks by taskIds (verify workspace membership).
  Call suggestPriorities(tasks).
  Return { suggestions: AIPrioritySuggestion[] }.

Step 3 — `components/ai/AIPrioritySuggestions.tsx`:
  Triggered by a "Review priorities" button in the Tasks page header.
  Opens as a slide-in panel or modal.

  Loading state: spinner + "Analysing your tasks…"

  Result: a list of diff rows:
    Each row: task title | current priority badge → suggested priority badge | reason | Accept checkbox
  All rows start checked.

  Buttons:
    "Apply selected" — calls editTask for each checked suggestion with the new priority
    "Dismiss" — closes without saving

Step 4 — Wire into Tasks page header.

Step 5 — Tests:
  tests/lib/ai/tasks.test.ts (add):
    - suggestPriorities sends correct task data to Anthropic
    - Returns only tasks where suggested !== current
    - Handles empty task array (returns [])

  tests/api/ai-suggest-priorities.test.ts:
    - 401 when not authenticated
    - 400 on missing taskIds
    - 200 with suggestions array on success
    - 500 on AI failure

  tests/components/ai/AIPrioritySuggestions.test.tsx:
    - Shows loading while fetching
    - Renders each suggestion with both priority badges and reason
    - Unchecking a row excludes it from "Apply selected"
    - "Apply selected" calls editTask for each checked row
    - "Dismiss" closes without calling editTask

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark priority suggester complete, next = Stale task detector.
```

---

## PROMPT P3.7 — Stale task detector

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/3-ai.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

Tasks untouched for 14+ days are surfaced with suggested actions: archive, reschedule,
or keep. Detection is client-side (updated_at field). AI is used to suggest an action
and write a brief reason.

Step 1 — `lib/stale-tasks.ts`:
  getStaleTasks(tasks: Task[], now?: Date): Task[]
    Returns tasks where updated_at < (now - 14 days), status !== 'done',
    is_archived === false, parent_id === null.
    now defaults to new Date() (injectable for tests).

Step 2 — `lib/ai/tasks.ts` — add suggestStaleAction:

  StaleAction = 'archive' | 'reschedule' | 'keep'

  AIStaleTaskSuggestion = {
    taskId: string
    action: StaleAction
    reason: string
    newDueDate?: string   // YYYY-MM-DD, only present if action='reschedule'
  }

  async function suggestStaleActions(tasks: Task[]): Promise<AIStaleTaskSuggestion[]>

  System prompt: ask AI to review stale tasks and suggest one of: archive (likely
  no longer relevant), reschedule (still valid, set a new due date), or keep
  (actively working but not yet updated). Return JSON array.

Step 3 — `app/api/ai/stale-tasks/route.ts` (POST):
  Standard AI route pattern.
  Body: { taskIds: string[] }
  Fetch tasks, verify workspace, call suggestStaleActions.
  Return { suggestions: AIStaleTaskSuggestion[] }.

Step 4 — `components/ai/StaleTaskReview.tsx`:
  Dismissible banner on the Dashboard (shown only when getStaleTasks() returns > 0).
  Banner: "{N} tasks haven't been updated in 14+ days. Review them →"
  Clicking opens a modal/panel with:
    - Loading state while AI suggestions load
    - Each stale task row: title | AI-suggested action badge | reason | Override dropdown
    - "Apply all suggestions" and "Dismiss" buttons
  Applying: archive → archiveTask; reschedule → editTask with new due_date; keep → no-op.
  Store dismissed state in localStorage per week so banner doesn't reappear the same week.

Step 5 — Wire into Dashboard.

Step 6 — Tests:
  tests/lib/stale-tasks.test.ts:
    - Returns tasks with updated_at > 14 days ago
    - Excludes done tasks
    - Excludes archived tasks
    - Excludes subtasks (parent_id !== null)
    - Returns empty array when all tasks are fresh

  tests/api/ai-stale-tasks.test.ts:
    - 401 / 400 / 200 / 500 per standard pattern

  tests/components/ai/StaleTaskReview.test.tsx:
    - Banner hidden when no stale tasks
    - Banner shows count when stale tasks exist
    - "Apply all" calls correct handlers for each action type
    - "Dismiss" stores dismissed state and hides banner

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark stale task detector complete, next = Workload advisor.
```

---

## PROMPT P3.8 — Workload advisor

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/3-ai.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

The workload advisor analyses the user's upcoming task load and surfaces a short
plain-language assessment on the Dashboard.

Step 1 — `lib/ai/tasks.ts` — add analyzeWorkload:

  WorkloadAnalysis = {
    assessment: 'light' | 'balanced' | 'heavy' | 'critical'
    summary: string        // 2–3 sentences
    suggestions: string[]  // 2–3 actionable bullet points
  }

  async function analyzeWorkload(tasks: Task[]): Promise<WorkloadAnalysis>

  Send AI a summary: count of tasks due this week, next week, overdue count,
  high/urgent count, estimated minutes total (if present). No task titles.

  System prompt: ask for honest, brief workload assessment with suggestions.
  Return JSON matching WorkloadAnalysis.

Step 2 — `app/api/ai/workload/route.ts` (POST):
  Standard AI route pattern. No body needed — fetch tasks server-side.
  Return WorkloadAnalysis.

Step 3 — `components/dashboard/WorkloadAdvisor.tsx`:
  Card on Dashboard below WeeklyDigest.
  Loads on mount (no cache — always fresh).
  Assessment badge (light=green, balanced=cerulean, heavy=orange, critical=red).
  Summary paragraph. Suggestion bullets.
  Refresh button to re-run analysis.

Step 4 — Tests:
  tests/lib/ai/tasks.test.ts (add):
    - analyzeWorkload sends task summary (not titles) to Anthropic
    - Returns correct WorkloadAnalysis shape

  tests/api/ai-workload.test.ts — standard 401/429/200/500 cases

  tests/components/dashboard/WorkloadAdvisor.test.tsx:
    - Shows loading on mount
    - Renders assessment badge and summary on success
    - Refresh button re-calls the API

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark workload advisor complete, next = Meeting agenda builder.
```

---

## PROMPT P3.9 — Meeting agenda builder

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/3-ai.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

Generate a structured meeting agenda from a project's current tasks.

Step 1 — `lib/ai/tasks.ts` — add buildMeetingAgenda:

  AgendaItem = {
    title: string
    owner?: string     // null — collaboration is v2; leave as optional for now
    durationMins: number
    notes?: string
  }

  MeetingAgenda = {
    goal: string
    items: AgendaItem[]
    openQuestions: string[]
  }

  async function buildMeetingAgenda(projectName: string, tasks: Task[]): Promise<MeetingAgenda>

  Send in-progress and high-priority tasks (title + status + priority).
  System prompt: produce a focused meeting agenda JSON.

Step 2 — `app/api/ai/meeting-agenda/route.ts` (POST):
  Body: { projectId: string }
  Standard AI route pattern.
  Fetch project + tasks. Call buildMeetingAgenda.
  Return MeetingAgenda.

Step 3 — `components/ai/MeetingAgendaDialog.tsx`:
  Triggered by a "Generate agenda" button in the project page header.
  Dialog with:
    Loading state → rendered agenda → "Copy as Markdown" button + "Close"
  Markdown format:
    ## [Project name] — Meeting Agenda
    **Goal:** [goal]
    ### Items
    - [title] (~[duration] min)
      [notes if present]
    ### Open Questions
    - [question]

Step 4 — Wire into projects/[id]/page.tsx header.

Step 5 — Tests:
  tests/lib/ai/tasks.test.ts (add): buildMeetingAgenda sends correct prompt + parses
  tests/api/ai-meeting-agenda.test.ts — standard pattern
  tests/components/ai/MeetingAgendaDialog.test.tsx:
    - Opens on button click
    - Shows loading state
    - Renders goal, items, open questions
    - "Copy as Markdown" copies formatted text to clipboard

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark meeting agenda builder complete, next = Smart daily scheduler.
```

---

## PROMPT P3.10 — Smart daily scheduler

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/3-ai.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

AI suggests a day-by-day plan for the coming week. User can apply it to My Day in bulk.

Step 1 — `lib/ai/tasks.ts` — add generateDailySchedule:

  DayPlan = {
    date: string         // YYYY-MM-DD
    dayName: string      // 'Monday', 'Tuesday', etc.
    taskIds: string[]    // IDs of tasks assigned to this day
    reasoning: string    // brief explanation of the day's focus
  }

  WeeklySchedule = { days: DayPlan[] }

  async function generateDailySchedule(tasks: Task[], weekStart: Date): Promise<WeeklySchedule>

  Include tasks: todo/in_progress, not archived, not snoozed.
  Send to AI: task title, priority, estimated_mins, current due_date.
  AI distributes them across Mon–Fri of the given week.
  System prompt: balance workload, respect due dates (must-do on due day),
  return JSON matching WeeklySchedule.

Step 2 — `app/api/ai/schedule/route.ts` (POST):
  Body: { weekStart: string } (YYYY-MM-DD of the Monday)
  Standard AI route pattern.
  Return WeeklySchedule.

Step 3 — `components/ai/WeeklyScheduler.tsx`:
  Opened from My Day page header via "Plan my week" button.
  Full-screen modal or large slide-in panel.

  Loading state → weekly schedule view:
    Five day columns (Mon–Fri), each showing assigned tasks as cards.
    Task cards: title + priority dot + estimated time.
    Drag tasks between day columns to adjust (dnd-kit, updates local state only).

  "Apply to My Day" button: sets due_date on each task to its assigned day via
  editTask (one call per task). Shows progress toast. Closes panel.

  "Cancel" dismisses without saving.

Step 4 — Tests:
  tests/lib/ai/tasks.test.ts (add):
    - generateDailySchedule sends correct task summary and weekStart
    - Returns WeeklySchedule with days array covering Mon–Fri

  tests/api/ai-schedule.test.ts — standard 401/429/400/200/500 pattern

  tests/components/ai/WeeklyScheduler.test.tsx:
    - Shows loading while fetching
    - Renders five day columns
    - Each task appears in its assigned day
    - "Apply to My Day" calls editTask for each task with the correct date
    - "Cancel" closes without calling editTask

Run `npm test` — all must pass. Run `npm run type-check` — zero errors.
Update PROGRESS.md: mark smart daily scheduler complete, next = Phase 3 close-out.
```

---

## PROMPT P3.11 — Phase 3 close-out checklist

```
Read CLAUDE.md, .claude/rules/testing.md, .claude/phases/3-ai.md, and PROGRESS.md
in that order. Confirm: current phase, last completed task, next task.

This is the Phase 3 close-out. Do not build new features — only validate and document.

Run all four in order. Fix everything before moving to the next:

1. npm run type-check   — zero TypeScript errors.

2. npm test             — all tests pass. Never delete a failing test — fix
                          the code or the assertion.

3. npm run test:coverage — Phase 3 thresholds required:
     Lines ≥ 80% · Functions ≥ 80% · Branches ≥ 75%
   If below: identify gaps in the coverage report. Priority order for gap-filling:
     a. AI lib functions (lib/ai/) — pure logic, high-value tests
     b. API route handlers (app/api/ai/) — integration tests with mocked Anthropic
     c. AI components (components/ai/) — user interaction paths
   Never mock the module under test — only mock its dependencies.

4. npm run build        — production build succeeds with zero errors.

Security check (manual — no code):
  - Verify every /api/ai/* route returns 401 for unauthenticated requests
  - Verify every /api/ai/* route returns 429 after 10 requests in 1 minute
    (use a test account + loop in browser devtools or Postman — do not write
    automated tests that hit real Upstash)

After all four pass, update PROGRESS.md:
  - Move all Phase 3 items into "Completed"
  - Set "Current phase" to "Phase 3 — AI (complete)"
  - Set "Next task" to Phase 4 opening items (read .claude/phases/4-productivity.md)
  - Update "Test status" section with actual passing numbers and coverage
  - Record any AI prompts that consistently needed retry or produced poor results
    — this informs prompt tuning in Phase 5

Do not commit — leave that for the user.
```

---

## Summary

| Prompt | Feature | Key output |
|--------|---------|-----------|
| P3.0 | AI infrastructure | anthropic client, rate limiter, extractJSON, tests |
| P3.1 | Natural language task creation | /api/ai/create-task, AICommandBar, preview + confirm |
| P3.2 | Task breakdown | /api/ai/breakdown, AITaskBreakdown, subtask confirm |
| P3.3 | Description editor + slash commands | SlashTextarea, SlashCommandMenu |
| P3.4 | AI description writer | /api/ai/continue-description, /ai slash command wired |
| P3.5 | Weekly digest | /api/ai/weekly-digest, WeeklyDigest component, localStorage cache |
| P3.6 | Priority suggester | /api/ai/suggest-priorities, AIPrioritySuggestions diff view |
| P3.7 | Stale task detector | getStaleTasks, /api/ai/stale-tasks, StaleTaskReview banner |
| P3.8 | Workload advisor | /api/ai/workload, WorkloadAdvisor dashboard card |
| P3.9 | Meeting agenda builder | /api/ai/meeting-agenda, MeetingAgendaDialog, copy as markdown |
| P3.10 | Smart daily scheduler | /api/ai/schedule, WeeklyScheduler drag-to-adjust panel |
| P3.11 | Phase 3 close-out | Coverage ≥ 80%, security checks, PROGRESS.md updated |

---

## Notes for future Claude sessions

- **Rate limit is enforced at 10 requests/minute per user** — AI tests must mock
  `checkRateLimit`, never call real Upstash in tests.
- **Never include task descriptions in AI prompts** that send batches of tasks —
  descriptions can be long and will balloon the context window. Titles + metadata only.
- **extractJSON handles both raw JSON and fenced code blocks** — always use it; never
  call JSON.parse directly on AI responses.
- **Anthropic mock** is already in `tests/mocks/anthropic.ts` — always import from
  there, never create inline fetch mocks in AI tests.
- **AI calls are always try/catch** with a user-facing fallback — the app must never
  crash when an AI call fails. Degrade gracefully.
- **Streaming is not used** — all AI calls use the standard `messages.create` API
  (non-streaming). This keeps the architecture simple and the tests straightforward.
  If streaming is added later, it belongs in Phase 5 polish.
