'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { ProjectDefaultView } from '@/lib/types'

export interface UndoItem {
  label: string
  message?: string
  undo?: () => void
}

interface UIContextValue {
  activeView: ProjectDefaultView
  setActiveView: (view: ProjectDefaultView) => void
  detailTaskId: string | null
  openDetail: (taskId: string) => void
  closeDetail: () => void
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  undoStack: UndoItem[]
  pushUndo: (item: UndoItem) => void
  dismissUndo: (label: string) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
}

const UIContext = createContext<UIContextValue | null>(null)

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveView] = useState<ProjectDefaultView>('list')
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [undoStack, setUndoStack] = useState<UndoItem[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const openDetail = useCallback((taskId: string) => setDetailTaskId(taskId), [])
  const closeDetail = useCallback(() => setDetailTaskId(null), [])

  const pushUndo = useCallback((item: UndoItem) => {
    setUndoStack(prev => [...prev, item])
  }, [])

  const dismissUndo = useCallback((label: string) => {
    setUndoStack(prev => prev.filter(i => i.label !== label))
  }, [])

  return (
    <UIContext.Provider
      value={{
        activeView,
        setActiveView,
        detailTaskId,
        openDetail,
        closeDetail,
        commandPaletteOpen,
        setCommandPaletteOpen,
        undoStack,
        pushUndo,
        dismissUndo,
        sidebarCollapsed,
        setSidebarCollapsed,
      }}
    >
      {children}
    </UIContext.Provider>
  )
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
