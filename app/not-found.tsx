import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-6"
      style={{ background: '#061419' }}
    >
      <div className="text-center space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: '#7D99AA' }}>
          404
        </p>
        <h1 className="text-2xl font-semibold" style={{ color: '#E2EDF2' }}>
          Page not found
        </h1>
        <p className="text-sm" style={{ color: '#7D99AA' }}>
          This page doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="text-sm font-medium transition-colors"
        style={{ color: '#00B6EC' }}
      >
        Back to dashboard
      </Link>
    </div>
  )
}
