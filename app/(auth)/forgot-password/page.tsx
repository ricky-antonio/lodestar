'use client'

import { useState } from 'react'
import Link from 'next/link'
import { sendPasswordReset } from '@/lib/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await sendPasswordReset(email)
    } finally {
      // Always show the generic confirmation — never reveal if the email exists
      setLoading(false)
      setSubmitted(true)
    }
  }

  return (
    <div className="w-full max-w-[380px]">
      <div className="mb-8 text-center">
        <span className="text-[#00B6EC] font-bold text-2xl tracking-tight select-none">lodestar</span>
      </div>

      <div className="bg-white border border-[#C5DCE6] rounded-xl p-8">
        <h1 className="text-2xl font-semibold text-[#0F2530] tracking-tight mb-1">Reset password</h1>
        <p className="text-sm text-[#5E7F91] mb-6">
          Enter your email and we&apos;ll send a reset link.
        </p>

        {submitted ? (
          <div className="rounded-lg bg-[#E8F8FD] border border-[#B8ECFA] px-4 py-4 text-sm text-[#007DA4] mb-6">
            If an account exists for <span className="font-medium">{email}</span>, you&apos;ll
            receive a reset link shortly.
          </div>
        ) : (
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

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-[#5E7F91]">
          <Link
            href="/login"
            className="text-[#00B6EC] hover:text-[#009AC8] transition-colors font-medium"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
