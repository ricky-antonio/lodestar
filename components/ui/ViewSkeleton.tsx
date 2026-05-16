'use client'

import { Skeleton } from '@/components/ui/skeleton'

const ROW_WIDTHS = ['55%', '72%', '38%', '64%', '48%', '80%', '43%', '60%']

function SkeletonRow({ width }: { width: string }) {
  return (
    <div
      className="flex items-center gap-3 px-3 rounded-lg"
      style={{
        height: 48,
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
      }}
    >
      {/* priority dot */}
      <Skeleton className="w-2 h-2 rounded-full flex-none" style={{ background: 'var(--surface-2)' }} />
      {/* title */}
      <Skeleton className="h-3 rounded flex-none" style={{ width, background: 'var(--surface-2)' }} />
      {/* spacer */}
      <div className="flex-1" />
      {/* date pill */}
      <Skeleton className="h-5 w-16 rounded-full flex-none" style={{ background: 'var(--surface-2)' }} />
    </div>
  )
}

export function ViewSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-1.5 w-full" aria-busy="true" aria-label="Loading tasks">
      {ROW_WIDTHS.slice(0, rows).map((w, i) => (
        <SkeletonRow key={i} width={w} />
      ))}
    </div>
  )
}
