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
  getAllTasks,
  getTasksBySearch,
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
  addTask: (fields: Partial<Omit<Task, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>) => Promise<string | null>
  editTask: (id: string, updates: Partial<Omit<Task, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>) => Promise<void>
  removeTask: (id: string) => Promise<void>
  archiveTask: (id: string) => Promise<void>
  loading: boolean
}

const TasksContext = createContext<TasksContextValue | null>(null)

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const { workspace, loading: authLoading } = useAuth()
  const { activeProject } = useProjects()
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [searchOverride, setSearchOverride] = useState<Task[] | null>(null)
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
        const data = await getAllTasks(ws.id)
        if (!cancelled) setAllTasks(data)
      } catch {
        // Leave tasks as empty array on error
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [workspace, authLoading])

  // Debounced server-side search — replaces displayed list while active
  useEffect(() => {
    if (!workspace) return
    const term = filters.search
    if (!term) {
      setSearchOverride(null)
      return
    }
    const wsId = workspace.id
    const timer = setTimeout(async () => {
      const results = await getTasksBySearch(wsId, null, term)
      setSearchOverride(results)
    }, 300)
    return () => clearTimeout(timer)
  }, [filters.search, workspace])

  const tasks = searchOverride ?? allTasks

  const addTask = useCallback(async (
    fields: Partial<Omit<Task, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>
  ) => {
    if (!workspace) return null
    const wsId = workspace.id
    const maxPosition = allTasks.reduce((m, t) => Math.max(m, t.position), 0)
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
    const previousAll = allTasks
    setAllTasks(prev => [...prev, optimistic])
    try {
      const created = await createTaskInDB(wsId, { ...fields, position })
      setAllTasks(prev => prev.map(t => t.id === optimistic.id ? created : t))
      return created.id
    } catch {
      setAllTasks(previousAll)
      return null
    }
  }, [workspace, activeProject, allTasks])

  const editTask = useCallback(async (
    id: string,
    updates: Partial<Omit<Task, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>
  ) => {
    const previousAll = allTasks
    const previousSearch = searchOverride
    setAllTasks(prev => {
      const mapped = prev.map(t => t.id === id ? { ...t, ...updates } : t)
      return 'position' in updates ? [...mapped].sort((a, b) => a.position - b.position) : mapped
    })
    if (searchOverride !== null) {
      setSearchOverride(prev => prev?.map(t => t.id === id ? { ...t, ...updates } : t) ?? null)
    }
    try {
      await updateTaskInDB(id, updates)
    } catch {
      setAllTasks(previousAll)
      setSearchOverride(previousSearch)
    }
  }, [allTasks, searchOverride])

  const removeTask = useCallback(async (id: string) => {
    const previousAll = allTasks
    const previousSearch = searchOverride
    setAllTasks(prev => prev.filter(t => t.id !== id))
    if (searchOverride !== null) {
      setSearchOverride(prev => prev?.filter(t => t.id !== id) ?? null)
    }
    try {
      await deleteTaskInDB(id)
    } catch {
      setAllTasks(previousAll)
      setSearchOverride(previousSearch)
    }
  }, [allTasks, searchOverride])

  const archiveTask = useCallback(async (id: string) => {
    const previousAll = allTasks
    const previousSearch = searchOverride
    setAllTasks(prev => prev.filter(t => t.id !== id))
    if (searchOverride !== null) {
      setSearchOverride(prev => prev?.filter(t => t.id !== id) ?? null)
    }
    try {
      await archiveTaskInDB(id)
    } catch {
      setAllTasks(previousAll)
      setSearchOverride(previousSearch)
    }
  }, [allTasks, searchOverride])

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
