'use client'

import { useEffect, useRef } from 'react'
import { keyboard } from '@/lib/keyboard'
import { useProjects } from '@/lib/context/ProjectsContext'
import { useUI } from '@/lib/context/UIContext'

function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function QuickCapture() {
  const { openCreate, openProjectCreate } = useUI()
  const { activeProject, projects } = useProjects()
  const activeProjectRef = useRef(activeProject)
  const projectsRef = useRef(projects)

  useEffect(() => {
    activeProjectRef.current = activeProject
    projectsRef.current = projects
  }, [activeProject, projects])

  useEffect(() => {
    keyboard.mount()
    const unregister = keyboard.register({
      key: 'q',
      description: 'Quick capture',
      handler: () => {
        if (projectsRef.current.length === 0) {
          openProjectCreate()
        } else {
          openCreate({
            project_id: activeProjectRef.current?.id ?? null,
            due_date: getTodayStr(),
          })
        }
      },
    })
    return () => {
      unregister()
      keyboard.unmount()
    }
  }, [openCreate, openProjectCreate])

  return null
}
