'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { IconMailCheck } from '@tabler/icons-react'
import { resendVerificationEmail } from '@/lib/auth'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const [countdown, setCountdown] = useState(0)
  const [resendError, setResendError] = useState<string | null>(null)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  async function handleResend() {
    if (!email || countdown > 0) return
    setResendError(null)
    setResendSuccess(false)
    setLoading(true)
    try {
      await resendVerificationEmail(email)
      setResendSuccess(true)
      setCountdown(60)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to resend. Please try again.'
      setResendError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[380px]">
      <div className="mb-8 text-center">
        <span className="text-[#00B6EC] font-bold text-2xl tracking-tight select-none">lodestar</span>
      </div>

      <div className="bg-white border border-[#C5DCE6] rounded-xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-[#E8F8FD] flex items-center justify-center">
            <IconMailCheck size={24} className="text-[#00B6EC]" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-[#0F2530] tracking-tight mb-2">Check your inbox</h1>
        <p className="text-sm text-[#5E7F91] mb-1">We sent a verification link to</p>
        {email && (
          <p className="text-sm font-medium text-[#0F2530] mb-6 break-all">{email}</p>
        )}
        {!email && <div className="mb-6" />}

        {resendSuccess && (
          <div className="mb-4 rounded-lg bg-[#E8F8FD] border border-[#B8ECFA] px-4 py-3 text-sm text-[#007DA4]">
            Verification email sent.
          </div>
        )}

        {resendError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {resendError}
          </div>
        )}

        <button
          type="button"
          onClick={handleResend}
          disabled={loading || countdown > 0}
          className="btn-primary mb-4"
        >
          {countdown > 0
            ? `Resend in ${countdown}s`
            : loading
              ? 'Sending…'
              : 'Resend verification email'}
        </button>

        <Link
          href="/signup"
          className="text-sm text-[#5E7F91] hover:text-[#0F2530] transition-colors"
        >
          Wrong email? Go back
        </Link>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
