import { ViewSkeleton } from '@/components/ui/ViewSkeleton'

export default function AppLoading() {
  return (
    <div className="flex flex-col flex-1 min-w-0 p-6 gap-4" style={{ background: 'var(--bg)' }}>
      {/* header skeleton */}
      <div className="flex items-center gap-3">
        <div
          className="h-7 w-32 rounded-md animate-pulse"
          style={{ background: 'var(--surface-2)' }}
        />
        <div
          className="h-5 w-8 rounded-full animate-pulse"
          style={{ background: 'var(--surface-2)' }}
        />
      </div>
      {/* filter bar skeleton */}
      <div
        className="h-9 w-full rounded-lg animate-pulse"
        style={{ background: 'var(--surface-2)' }}
      />
      <ViewSkeleton rows={8} />
    </div>
  )
}
