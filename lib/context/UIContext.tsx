'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { ProjectDefaultView } from '@/lib/types'

export interface UndoItem {
  label: string
  message?: string
  undo?: () => void
  canUndo?: boolean
}

export interface CreateDefaults {
  project_id?: string | null
  due_date?: string | null
}

interface UIContextValue {
  activeView: ProjectDefaultView
  setActiveView: (view: ProjectDefaultView) => void
  detailTaskId: string | null
  isCreating: boolean
  createDefaults: CreateDefaults | null
  openDetail: (taskId: string) => void
  openCreate: (defaults?: CreateDefaults) => void
  closeDetail: () => void
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  undoStack: UndoItem[]
  pushUndo: (item: UndoItem) => void
  dismissUndo: (label: string) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  projectCreateOpen: boolean
  openProjectCreate: () => void
  closeProjectCreate: () => void
  aiBarOpen: boolean
  toggleAiBar: () => void
  closeAiBar: () => void
}

const CREATE_SENTINEL = '__create__'

const UIContext = createContext<UIContextValue | null>(null)

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveView] = useState<ProjectDefaultView>('board')
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null)
  const [createDefaults, setCreateDefaults] = useState<CreateDefaults | null>(null)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [undoStack, setUndoStack] = useState<UndoItem[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [projectCreateOpen, setProjectCreateOpen] = useState(false)
  const [aiBarOpen, setAiBarOpen] = useState(false)

  const openProjectCreate = useCallback(() => setProjectCreateOpen(true), [])
  const closeProjectCreate = useCallback(() => setProjectCreateOpen(false), [])
  const toggleAiBar = useCallback(() => setAiBarOpen(v => !v), [])
  const closeAiBar = useCallback(() => setAiBarOpen(false), [])

  const isCreating = detailTaskId === CREATE_SENTINEL

  const openDetail = useCallback((taskId: string) => {
    setCreateDefaults(null)
    setDetailTaskId(taskId)
  }, [])

  const openCreate = useCallback((defaults?: CreateDefaults) => {
    setCreateDefaults(defaults ?? null)
    setDetailTaskId(CREATE_SENTINEL)
  }, [])

  const closeDetail = useCallback(() => {
    setCreateDefaults(null)
    setDetailTaskId(null)
  }, [])

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
        isCreating,
        createDefaults,
        openDetail,
        openCreate,
        closeDetail,
        commandPaletteOpen,
        setCommandPaletteOpen,
        undoStack,
        pushUndo,
        dismissUndo,
        sidebarCollapsed,
        setSidebarCollapsed,
        projectCreateOpen,
        openProjectCreate,
        closeProjectCreate,
        aiBarOpen,
        toggleAiBar,
        closeAiBar,
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
