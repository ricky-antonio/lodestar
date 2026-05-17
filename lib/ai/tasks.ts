import { anthropic, AI_MODEL } from './client'
import { extractJSON } from './parse'
import type { TaskPriority } from '@/lib/types'

export interface AITaskPreview {
  title: string
  description?: string
  priority: TaskPriority
  due_date?: string
  estimated_mins?: number | null
}

const SYSTEM_PROMPT =
  "You are a task extraction assistant. Given a plain-English description of a task, " +
  "return a JSON object with these fields: title (string, required), description " +
  "(string, optional), priority ('urgent'|'high'|'medium'|'low'), due_date " +
  "(YYYY-MM-DD or null), estimated_mins (number or null). Return only valid JSON, no markdown."

export async function createTaskFromPrompt(prompt: string): Promise<AITaskPreview> {
  async function attempt(): Promise<AITaskPreview> {
    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')

    return extractJSON<AITaskPreview>(text)
  }

  try {
    return await attempt()
  } catch {
    return await attempt()
  }
}
