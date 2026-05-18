import { anthropic, AI_MODEL } from './client'
import { extractJSON } from './parse'
import type { TaskPriority } from '@/lib/types'

export interface AISubtaskSuggestion {
  title: string
  estimated_mins?: number | null
}

export interface AITaskItem {
  title: string
  description?: string | null
  priority: TaskPriority
  due_date?: string | null
  estimated_mins?: number | null
  subtasks: string[]
}

export interface AITaskResult {
  tasks: AITaskItem[]
}

const SYSTEM_PROMPT =
  "You are a task planning assistant. Given a plain-English prompt, decide whether to group or split.\n\n" +
  "GROUPING: when the items share a location, trip, or context (multiple stops on one outing, " +
  "steps toward one goal), return ONE task. " +
  "NEVER pack items into the title with + or — separators. " +
  "Each individual item goes into the subtasks array — one entry per item, phrased as an action " +
  "starting with a verb (good: 'Visit the Bean', bad: 'bean' or 'the Bean').\n\n" +
  "SPLITTING: when items are genuinely unrelated (different days, projects, or domains), " +
  "return one task per item in the tasks array.\n\n" +
  "Return JSON: { \"tasks\": [ { title, description, priority, due_date, estimated_mins, subtasks } ] }\n" +
  "- title: a natural, readable phrase describing the overall goal (e.g. 'Downtown Chicago day', " +
  "'Prepare the quarterly report') — not a list of items\n" +
  "- description: one sentence summarizing the intent in plain English; always include, " +
  "even when subtasks are present (e.g. 'A full day downtown covering sightseeing, coffee, and shopping')\n" +
  "- priority: 'urgent'|'high'|'medium'|'low'\n" +
  "- due_date: YYYY-MM-DD or null if not mentioned\n" +
  "- estimated_mins: number or null\n" +
  "- subtasks: string[] — one action-verb entry per distinct item when grouping; [] for a single item\n" +
  "Return only valid JSON, no markdown."

function todayISO(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function normalizeTask(task: AITaskItem): AITaskItem {
  let { subtasks = [], description } = task

  // If model put bullet lines in description instead of subtasks, extract them
  if (subtasks.length === 0 && description) {
    const lines = description.split('\n').map(l => l.trim()).filter(Boolean)
    const bullets = lines.filter(l => l.startsWith('- ')).map(l => l.slice(2).trim())
    // Only extract if the description is entirely a bullet list (no prose lines)
    if (bullets.length >= 2 && bullets.length === lines.length) {
      subtasks = bullets
      description = null
    }
  }

  // Default due_date to today when not specified
  const due_date = task.due_date ?? todayISO()

  return { ...task, subtasks, description: description ?? null, due_date }
}

export async function createTaskFromPrompt(prompt: string): Promise<AITaskResult> {
  async function attempt(): Promise<AITaskResult> {
    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')

    const result = extractJSON<AITaskResult>(text)
    if (!result || !Array.isArray(result.tasks) || result.tasks.length === 0) {
      throw new Error('AI returned invalid task structure')
    }
    return { tasks: result.tasks.map(normalizeTask) }
  }

  try {
    return await attempt()
  } catch {
    return await attempt()
  }
}

const BREAKDOWN_SYSTEM_PROMPT =
  "You are a task decomposition assistant. Given a task title and optional " +
  "description, suggest 3 to 6 concrete subtasks needed to complete it. Return a " +
  "JSON array of objects with: title (string, required), estimated_mins (number " +
  "or null). Return only valid JSON, no markdown."

export async function breakdownTask(task: { title: string; description?: string | null }): Promise<AISubtaskSuggestion[]> {
  const userMessage = task.description
    ? `Task: ${task.title}\nDescription: ${task.description}`
    : `Task: ${task.title}`

  const message = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    system: BREAKDOWN_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  const text = message.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('')

  const result = extractJSON<AISubtaskSuggestion[]>(text)
  if (!Array.isArray(result) || result.length < 3 || result.length > 6) {
    throw new Error('AI returned invalid subtask count')
  }
  return result
}
