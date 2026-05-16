'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import { useAuth } from './AuthContext'
import {
  getProjects,
  createProject as createProjectInDB,
  updateProject as updateProjectInDB,
  archiveProject as archiveProjectInDB,
} from '@/lib/projects'
import type { Project } from '@/lib/types'

const LAST_PROJECT_KEY = 'lodestar:lastProjectId'

interface ProjectsContextValue {
  projects: Project[]
  activeProject: Project | null
  setActiveProject: (project: Project | null) => void
  addProject: (name: string, color: string) => Promise<string | null>
  editProject: (id: string, updates: Partial<Pick<Project, 'name' | 'color' | 'description' | 'default_view'>>) => Promise<void>
  removeProject: (id: string) => Promise<void>
  loading: boolean
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null)

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const { workspace } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProject, setActiveProjectState] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  const setActiveProject = useCallback((project: Project | null) => {
    setActiveProjectState(project)
    if (project !== null) {
      localStorage.setItem(LAST_PROJECT_KEY, project.id)
    }
  }, [])

  useEffect(() => {
    if (!workspace) {
      setLoading(false)
      return
    }
    const ws = workspace
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const data = await getProjects(ws.id)
        if (!cancelled) {
          setProjects(data)
          // Restore last selected project across sessions
          const lastId = localStorage.getItem(LAST_PROJECT_KEY)
          if (lastId) {
            const found = data.find(p => p.id === lastId)
            if (found) setActiveProjectState(found)
          }
        }
      } catch {
        // Leave projects as empty array on error
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [workspace])

  const addProject = useCallback(async (name: string, color: string) => {
    if (!workspace) return null
    const wsId = workspace.id
    const optimistic: Project = {
      id: `temp-${Date.now()}`,
      workspace_id: wsId,
      name,
      color,
      description: null,
      status: 'active',
      default_view: 'list',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const previous = projects
    setProjects(prev => [...prev, optimistic])
    try {
      const created = await createProjectInDB(wsId, name, color)
      setProjects(prev => prev.map(p => p.id === optimistic.id ? created : p))
      setActiveProjectState(created)
      return created.id
    } catch {
      setProjects(previous)
      return null
    }
  }, [workspace, projects])

  const editProject = useCallback(async (
    id: string,
    updates: Partial<Pick<Project, 'name' | 'color' | 'description' | 'default_view'>>
  ) => {
    const previous = projects
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    if (activeProject?.id === id) setActiveProjectState(prev => prev ? { ...prev, ...updates } : prev)
    try {
      await updateProjectInDB(id, updates)
    } catch {
      setProjects(previous)
      if (activeProject?.id === id) setActiveProjectState(previous.find(p => p.id === id) ?? null)
    }
  }, [projects, activeProject])

  const removeProject = useCallback(async (id: string) => {
    const previous = projects
    const previousActive = activeProject
    setProjects(prev => prev.filter(p => p.id !== id))
    if (activeProject?.id === id) {
      setActiveProjectState(null)
      if (localStorage.getItem(LAST_PROJECT_KEY) === id) {
        localStorage.removeItem(LAST_PROJECT_KEY)
      }
    }
    try {
      await archiveProjectInDB(id)
    } catch {
      setProjects(previous)
      setActiveProjectState(previousActive)
    }
  }, [projects, activeProject])

  return (
    <ProjectsContext.Provider
      value={{ projects, activeProject, setActiveProject, addProject, editProject, removeProject, loading }}
    >
      {children}
    </ProjectsContext.Provider>
  )
}

export function useProjects(): ProjectsContextValue {
  const ctx = useContext(ProjectsContext)
  if (!ctx) throw new Error('useProjects must be used within ProjectsProvider')
  return ctx
}
