# Phase 3 — AI Features

## What to build

- [ ] Natural language task creation (`/api/ai/create-task`) with preview card + confirm
- [ ] Task breakdown: "Break this down" → 3–6 subtasks → check/uncheck → confirm
- [ ] Priority suggester: diff view showing current vs suggested per task with reasoning
- [ ] Task description writer: `/ai` slash command continues description from current text
- [ ] Slash commands in description editor: `/date`, `/task`, `/ai`
- [ ] Weekly digest: wins, concerns, focus for next week (saved to localStorage per week)
- [ ] Workload advisor
- [ ] Stale task detector: tasks untouched 14+ days. Runs weekly. Actions: archive/reschedule/keep
- [ ] Meeting agenda builder: project tasks → goal, items, owner/time, open questions. "Copy as markdown"
- [ ] Smart daily scheduler: AI suggests day-by-day plan for the week. "Apply to My Day" button

## AI function signatures (`lib/ai/tasks.ts`)

```ts
createTaskFromPrompt(prompt: string): Promise<AITaskPreview>
breakdownTask(taskId: string): Promise<AISubtaskSuggestion[]>
suggestPriorities(tasks: Task[]): Promise<AIPrioritySuggestion[]>
extractDueDate(title: string): Promise<Date | null>
```

`extractDueDate` detects: "by Friday", "before Tuesday", "next week", "end of month", "tomorrow". Always shows as a pre-filled suggestion — never silently sets a date.

## Tests to write (Phase 3)

**`lib/ai/tasks.test.ts`:**
- `createTaskFromPrompt` sends correct system prompt + user message
- Parses valid AI JSON response into `AITaskPreview`
- Retries once on JSON parse failure, throws after two failures
- `breakdownTask` returns array of 3–6 subtasks
- `suggestPriorities` returns correct structure per task

**`api/ai-create-task.test.ts`:**
- 400 on missing prompt / empty prompt
- Structured preview on valid input (mocked response)
- 500 with message on AI failure

**`api/ai-breakdown.test.ts`:**
- 400 on missing taskId
- 404 if task not found
- Subtask array on success

**`components/ai/AICommandBar.test.tsx`:**
- Input accepts text
- Submit calls AI endpoint
- Preview card renders returned fields
- Confirm calls task creation handler
- Cancel dismisses without saving

**`components/ai/AITaskBreakdown.test.tsx`:**
- Renders suggested subtasks as checkboxes (all checked by default)
- Unchecking excludes from confirmation payload
- Confirm calls handler with only checked subtasks

## Coverage target after Phase 3
Lines ≥ 80% · Functions ≥ 80% · Branches ≥ 75%
