import { vi } from 'vitest'

export const mockAnthropicResponse = (content: string) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      content: [{ type: 'text', text: content }],
      usage: { input_tokens: 10, output_tokens: 20 },
    }),
  })
}

export const mockAnthropicError = (status = 500, message = 'Internal server error') => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: async () => ({ error: { message } }),
  })
}
