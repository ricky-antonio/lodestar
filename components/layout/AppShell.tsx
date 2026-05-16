'use client'

import { useAuth } from '@/lib/context/AuthContext'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { MobileProjectBar } from './MobileProjectBar'
import { Topbar } from './Topbar'
import { Toast } from '@/components/ui/Toast'
import { QuickCapture } from '@/components/ui/QuickCapture'
import { KeyboardReferenceSheet } from '@/components/ui/KeyboardReferenceSheet'
import { AppShortcuts } from '@/components/ui/AppShortcuts'
import { TaskDetail } from '@/components/tasks/TaskDetail'
import { NavigationProgress } from '@/components/ui/NavigationProgress'

function ShellSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden" aria-busy="true" aria-label="Loading">
      {/* Sidebar skeleton */}
      <div
        className="hidden md:flex flex-col h-full shrink-0"
        style={{ width: 240, background: '#061419' }}
      >
        {/* Workspace row */}
        <div className="flex items-center px-3 h-12 shrink-0 gap-2">
          <div className="h-3 w-28 rounded animate-pulse" style={{ background: '#0F2530' }} />
        </div>
        {/* Project switcher area */}
        <div className="px-2 pb-2" style={{ borderBottom: '0.5px solid #1F3D4A' }}>
          <div className="h-8 rounded animate-pulse" style={{ background: '#0F2530' }} />
        </div>
        {/* Nav items */}
        <div className="flex flex-col gap-1 px-2 pt-2">
          {[72, 56, 64, 52].map((w, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 px-2 py-2 rounded"
            >
              <div className="w-4.5 h-4.5 rounded animate-pulse" style={{ background: '#0F2530', width: 18, height: 18 }} />
              <div className="h-3 rounded animate-pulse" style={{ background: '#0F2530', width: w }} />
            </div>
          ))}
        </div>
      </div>

      {/* Main area skeleton */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar skeleton */}
        <div
          className="flex items-center px-4 shrink-0"
          style={{ height: 46, background: 'var(--surface)', borderBottom: '0.5px solid var(--border)' }}
        >
          <div className="h-3 w-32 rounded animate-pulse" style={{ background: 'var(--surface-2)' }} />
          <div className="ml-auto w-7 h-7 rounded-full animate-pulse" style={{ background: 'var(--surface-2)' }} />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 p-6 flex flex-col gap-4" style={{ background: 'var(--bg)' }}>
          <div className="flex items-center gap-3">
            <div className="h-7 w-32 rounded animate-pulse" style={{ background: 'var(--surface-2)' }} />
            <div className="h-5 w-8 rounded-full animate-pulse" style={{ background: 'var(--surface-2)' }} />
          </div>
          <div className="h-9 rounded-lg animate-pulse" style={{ background: 'var(--surface-2)' }} />
          <div className="flex flex-col gap-1.5">
            {[55, 72, 38, 64, 48, 80, 43, 60].map((w, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 rounded-lg"
                style={{ height: 48, background: 'var(--surface)', border: '0.5px solid var(--border)' }}
              >
                <div className="w-2 h-2 rounded-full animate-pulse flex-none" style={{ background: 'var(--surface-2)' }} />
                <div className="h-3 rounded animate-pulse flex-none" style={{ width: `${w}%`, background: 'var(--surface-2)' }} />
                <div className="flex-1" />
                <div className="h-5 w-16 rounded-full animate-pulse flex-none" style={{ background: 'var(--surface-2)' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { loading: authLoading } = useAuth()

  if (authLoading) return <ShellSkeleton />

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Topbar />
          <main
            className="flex-1 overflow-auto pb-[100px] md:pb-0"
            style={{ background: 'var(--bg)' }}
          >
            {children}
          </main>
        </div>
      </div>
      <MobileProjectBar />
      <BottomNav />
      <Toast />
      <QuickCapture />
      <AppShortcuts />
      <KeyboardReferenceSheet />
      <TaskDetail />
      <NavigationProgress />
    </>
  )
}
