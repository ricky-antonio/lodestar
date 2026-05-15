'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import { useAuth } from './AuthContext'
import { useProjects } from './ProjectsContext'
import {
  getTasks,
  createTask as createTaskInDB,
  updateTask as updateTaskInDB,
  deleteTask as deleteTaskInDB,
  archiveTask as archiveTaskInDB,
  getFractionalPosition,
} from '@/lib/tasks'
import type { Task, FilterState } from '@/lib/types'

interface TasksContextValue {
  tasks: Task[]
  filters: FilterState
  setFilters: (filters: FilterState) => void
  addTask: (fields: Partial<Omit<Task, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>) => Promise<void>
  editTask: (id: string, updates: Partial<Omit<Task, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>) => Promise<void>
  removeTask: (id: string) => Promise<void>
  archiveTask: (id: string) => Promise<void>
  loading: boolean
}

const TasksContext = createContext<TasksContextValue | null>(null)

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const { workspace, loading: authLoading } = useAuth()
  const { activeProject } = useProjects()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filters, setFilters] = useState<FilterState>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!workspace) {
      setLoading(false)
      return
    }
    const ws = workspace
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const data = await getTasks(ws.id, activeProject?.id ?? null)
        if (!cancelled) setTasks(data)
      } catch {
        // Leave tasks as empty array on error
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [workspace, activeProject, authLoading])

  const addTask = useCallback(async (
    fields: Partial<Omit<Task, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>
  ) => {
    if (!workspace) return
    const wsId = workspace.id
    const maxPosition = tasks.reduce((m, t) => Math.max(m, t.position), 0)
    const position = getFractionalPosition(maxPosition || null, null)
    const optimistic: Task = {
      id: `temp-${Date.now()}`,
      workspace_id: wsId,
      project_id: activeProject?.id ?? null,
      parent_id: null,
      title: '',
      description: null,
      status: 'todo',
      priority: 'medium',
      assignee_id: null,
      due_date: null,
      estimated_mins: null,
      position,
      is_archived: false,
      is_recurring: false,
      recurrence_rule: null,
      snoozed_until: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...fields,
    }
    const previous = tasks
    setTasks(prev => [...prev, optimistic])
    try {
      const created = await createTaskInDB(wsId, { ...fields, position })
      setTasks(prev => prev.map(t => t.id === optimistic.id ? created : t))
    } catch {
      setTasks(previous)
    }
  }, [workspace, activeProject, tasks])

  const editTask = useCallback(async (
    id: string,
    updates: Partial<Omit<Task, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>
  ) => {
    const previous = tasks
    setTasks(prev => {
      const mapped = prev.map(t => t.id === id ? { ...t, ...updates } : t)
      return 'position' in updates ? [...mapped].sort((a, b) => a.position - b.position) : mapped
    })
    try {
      await updateTaskInDB(id, updates)
    } catch {
      setTasks(previous)
    }
  }, [tasks])

  const removeTask = useCallback(async (id: string) => {
    const previous = tasks
    setTasks(prev => prev.filter(t => t.id !== id))
    try {
      await deleteTaskInDB(id)
    } catch {
      setTasks(previous)
    }
  }, [tasks])

  const archiveTask = useCallback(async (id: string) => {
    const previous = tasks
    setTasks(prev => prev.filter(t => t.id !== id))
    try {
      await archiveTaskInDB(id)
    } catch {
      setTasks(previous)
    }
  }, [tasks])

  return (
    <TasksContext.Provider
      value={{ tasks, filters, setFilters, addTask, editTask, removeTask, archiveTask, loading }}
    >
      {children}
    </TasksContext.Provider>
  )
}

export function useTasks(): TasksContextValue {
  const ctx = useContext(TasksContext)
  if (!ctx) throw new Error('useTasks must be used within TasksProvider')
  return ctx
}
