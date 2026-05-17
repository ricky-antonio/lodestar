'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { keyboard } from '@/lib/keyboard'
import { useUI } from '@/lib/context/UIContext'

export function AppShortcuts() {
  const router = useRouter()
  const { setActiveView, toggleAiBar } = useUI()

  useEffect(() => {
    const unregisters = [
      keyboard.register({ key: 'd', chord: 'g', description: 'Go to Dashboard', handler: () => router.push('/dashboard') }),
      keyboard.register({ key: 'm', chord: 'g', description: 'Go to My Day', handler: () => router.push('/my-day') }),
      keyboard.register({ key: 't', chord: 'g', description: 'Go to Tasks', handler: () => router.push('/tasks') }),
      keyboard.register({ key: 'b', description: 'Board view', handler: () => setActiveView('board') }),
      keyboard.register({ key: 'l', description: 'List view', handler: () => setActiveView('list') }),
      keyboard.register({
        key: '/',
        description: 'Focus search',
        handler: () => document.querySelector<HTMLInputElement>('[data-search-input]')?.focus(),
      }),
      keyboard.register({ key: 'n', alt: true, description: 'Toggle AI task bar', handler: toggleAiBar }),
    ]
    return () => unregisters.forEach(u => u())
  }, [router, setActiveView, toggleAiBar])

  return null
}
