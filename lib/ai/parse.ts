export function extractJSON<T>(text: string): T {
  const stripped = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  try {
    return JSON.parse(stripped) as T
  } catch {
    throw new Error('AI returned invalid JSON')
  }
}
