'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { IconBrandGoogle } from '@tabler/icons-react'
import { signInWithEmail, signInWithGoogle } from '@/lib/auth'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isExpired = searchParams.get('reason') === 'expired'
  const isDeleted = searchParams.get('deleted') === 'true'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showResend, setShowResend] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setShowResend(false)
    setLoading(true)
    try {
      await signInWithEmail(email, password)
      router.push('/dashboard')
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : ''
      if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
        setError('Please verify your email before signing in.')
        setShowResend(true)
      } else {
        setError('Invalid email or password.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError(null)
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
        <h1 className="text-2xl font-semibold text-[#0F2530] tracking-tight mb-1">Welcome back</h1>
        <p className="text-sm text-[#5E7F91] mb-6">Sign in to your workspace</p>

        {isExpired && (
          <div className="mb-4 rounded-lg bg-[#FFF8EC] border border-[#FFD98A] px-4 py-3 text-sm text-[#EA6400]">
            Your session has expired. Please sign in again.
          </div>
        )}

        {isDeleted && (
          <div className="mb-4 rounded-lg bg-[#FFF8EC] border border-[#FFD98A] px-4 py-3 text-sm text-[#EA6400]">
            Your account has been deleted.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
            {showResend && (
              <>
                {' '}
                <Link
                  href={`/verify-email?email=${encodeURIComponent(email)}`}
                  className="underline font-medium"
                >
                  Resend verification email
                </Link>
              </>
            )}
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
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-[#0F2530]">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#00B6EC] hover:text-[#009AC8] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Signing in…' : 'Sign in'}
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
          No account?{' '}
          <Link
            href="/signup"
            className="text-[#00B6EC] hover:text-[#009AC8] transition-colors font-medium"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
