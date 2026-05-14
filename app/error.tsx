'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') console.error(error)
  }, [error])

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-6 p-8"
      style={{ background: '#061419' }}
    >
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold" style={{ color: '#E2EDF2' }}>
          Something went wrong
        </h1>
        <p className="text-sm" style={{ color: '#7D99AA' }}>
          An unexpected error occurred. Try again or return to the dashboard.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors"
          style={{ background: '#00B6EC' }}
          onMouseOver={e => (e.currentTarget.style.background = '#009AC8')}
          onMouseOut={e => (e.currentTarget.style.background = '#00B6EC')}
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          style={{
            background: 'transparent',
            border: '0.5px solid #3E6070',
            color: '#7D99AA',
          }}
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
