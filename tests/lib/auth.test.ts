import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockSupabase } from '../mocks/supabase'
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut,
  sendPasswordReset,
  updatePassword,
  resendVerificationEmail,
  updateEmail,
  deleteAccount,
} from '@/lib/auth'

beforeEach(() => vi.clearAllMocks())

describe('signInWithEmail', () => {
  it('resolves on success', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null })
    await expect(signInWithEmail('a@b.com', 'pass')).resolves.toBeUndefined()
  })

  it('throws the Supabase error on failure', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: new Error('Invalid login credentials'),
    })
    await expect(signInWithEmail('a@b.com', 'wrong')).rejects.toThrow('Invalid login credentials')
  })
})

describe('signUpWithEmail', () => {
  it('resolves on success', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({ data: {}, error: null })
    await expect(signUpWithEmail('a@b.com', 'pass')).resolves.toBeUndefined()
  })

  it('throws on duplicate email', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: null,
      error: new Error('User already registered'),
    })
    await expect(signUpWithEmail('a@b.com', 'pass')).rejects.toThrow('User already registered')
  })
})

describe('signInWithGoogle', () => {
  it('resolves on success', async () => {
    mockSupabase.auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null })
    await expect(signInWithGoogle()).resolves.toBeUndefined()
  })

  it('throws when OAuth provider errors', async () => {
    mockSupabase.auth.signInWithOAuth.mockResolvedValue({
      data: null,
      error: new Error('Provider error'),
    })
    await expect(signInWithGoogle()).rejects.toThrow('Provider error')
  })
})

describe('signOut', () => {
  it('resolves on success', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })
    await expect(signOut()).resolves.toBeUndefined()
  })

  it('throws on error', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({ error: new Error('Network error') })
    await expect(signOut()).rejects.toThrow('Network error')
  })
})

describe('sendPasswordReset', () => {
  it('resolves even when the email does not exist', async () => {
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: new Error('User not found'),
    })
    await expect(sendPasswordReset('unknown@b.com')).resolves.toBeUndefined()
  })

  it('resolves on success', async () => {
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null })
    await expect(sendPasswordReset('a@b.com')).resolves.toBeUndefined()
  })
})

describe('updatePassword', () => {
  it('resolves on success', async () => {
    mockSupabase.auth.updateUser.mockResolvedValue({ data: {}, error: null })
    await expect(updatePassword('newpass123')).resolves.toBeUndefined()
  })

  it('throws when session is missing or token has expired', async () => {
    mockSupabase.auth.updateUser.mockResolvedValue({
      data: null,
      error: new Error('Auth session missing'),
    })
    await expect(updatePassword('newpass123')).rejects.toThrow('Auth session missing')
  })
})

describe('updateEmail', () => {
  it('resolves on success', async () => {
    mockSupabase.auth.updateUser.mockResolvedValueOnce({ data: {}, error: null })
    await expect(updateEmail('new@b.com')).resolves.toBeUndefined()
    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({ email: 'new@b.com' })
  })

  it('throws on error', async () => {
    mockSupabase.auth.updateUser.mockResolvedValueOnce({
      data: null,
      error: new Error('Invalid email'),
    })
    await expect(updateEmail('bad')).rejects.toThrow('Invalid email')
  })
})

describe('deleteAccount', () => {
  it('resolves when server returns ok', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: true } as Response)
    await expect(deleteAccount('user-1')).resolves.toBeUndefined()
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/delete-account', { method: 'POST' })
  })

  it('throws with server message when response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Unauthorized' }),
    } as unknown as Response)
    await expect(deleteAccount('user-1')).rejects.toThrow('Unauthorized')
  })
})

describe('resendVerificationEmail', () => {
  it('resolves on success', async () => {
    mockSupabase.auth.resend.mockResolvedValue({ data: {}, error: null })
    await expect(resendVerificationEmail('a@b.com')).resolves.toBeUndefined()
  })

  it('throws on rate limit', async () => {
    mockSupabase.auth.resend.mockResolvedValue({
      data: null,
      error: new Error('Rate limit exceeded'),
    })
    await expect(resendVerificationEmail('a@b.com')).rejects.toThrow('Rate limit exceeded')
  })
})
