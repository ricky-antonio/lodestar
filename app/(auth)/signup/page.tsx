'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IconBrandGoogle } from '@tabler/icons-react'
import { signUpWithEmail, signInWithGoogle } from '@/lib/auth'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
      await signUpWithEmail(email, password)
      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : ''
      if (msg.includes('already registered') || msg.includes('already exists')) {
        setError('An account with this email already exists.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    try {
      await signInWithGoogle()
    } catch {
      setError('Google sign-in failed. Please try again.')
    }
  }

  return (
    <div className="w-full max-w-[380px]">
      <div className="mb-8 text-center">
        <span className="text-[#00B6EC] font-bold text-2xl tracking-tight select-none">lodestar</span>
      </div>

      <div className="bg-white border border-[#C5DCE6] rounded-xl p-8">
        <h1 className="text-2xl font-semibold text-[#0F2530] tracking-tight mb-1">Create account</h1>
        <p className="text-sm text-[#5E7F91] mb-6">Start navigating what matters</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-[#0F2530]">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="auth-input"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-[#0F2530]">
              Password
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
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#C5DCE6]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs text-[#7D99AA]">or</span>
          </div>
        </div>

        <button type="button" onClick={handleGoogle} className="btn-secondary">
          <IconBrandGoogle size={16} />
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-[#5E7F91]">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-[#00B6EC] hover:text-[#009AC8] transition-colors font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
