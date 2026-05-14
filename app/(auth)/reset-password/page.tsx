'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updatePassword } from '@/lib/auth'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => router.push('/login'), 2000)
    return () => clearTimeout(t)
  }, [success, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      await updatePassword(password)
      setSuccess(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : ''
      if (msg.includes('session') || msg.includes('expired') || msg.includes('invalid')) {
        setError('Your reset link has expired.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-[380px]">
        <div className="mb-8 text-center">
          <span className="text-[#00B6EC] font-bold text-2xl tracking-tight select-none">lodestar</span>
        </div>
        <div className="bg-white border border-[#C5DCE6] rounded-xl p-8 text-center">
          <div className="rounded-lg bg-[#E8F8FD] border border-[#B8ECFA] px-4 py-4 text-sm text-[#007DA4] mb-4">
            Password updated. Redirecting you to sign in…
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[380px]">
      <div className="mb-8 text-center">
        <span className="text-[#00B6EC] font-bold text-2xl tracking-tight select-none">lodestar</span>
      </div>

      <div className="bg-white border border-[#C5DCE6] rounded-xl p-8">
        <h1 className="text-2xl font-semibold text-[#0F2530] tracking-tight mb-1">New password</h1>
        <p className="text-sm text-[#5E7F91] mb-6">Choose a strong password for your account.</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
            {error.includes('expired') && (
              <>
                {' '}
                <Link href="/forgot-password" className="underline font-medium">
                  Request a new link
                </Link>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-[#0F2530]">
              New password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="auth-input"
              placeholder="Minimum 8 characters"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm" className="block text-sm font-medium text-[#0F2530]">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="auth-input"
              placeholder="Repeat password"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving…' : 'Set new password'}
          </button>
        </form>
      </div>
    </div>
  )
}
