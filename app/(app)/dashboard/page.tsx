'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconPlus, IconNorthStar } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useTasks } from '@/lib/context/TasksContext'
import { useProjects } from '@/lib/context/ProjectsContext'

const PRESET_COLORS = ['#00B6EC', '#FA9836', '#22C55E', '#8B5CF6', '#EF4444', '#66F4FF']

export default function DashboardPage() {
  const router = useRouter()
  const { tasks } = useTasks()
  const { projects, activeProject, loading, addProject } = useProjects()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])
  const [submitting, setSubmitting] = useState(false)

  // Navigate to the newly created project automatically
  const prevCountRef = useRef(projects.length)
  useEffect(() => {
    if (prevCountRef.current === 0 && projects.length > 0) {
      router.push(`/projects/${projects[projects.length - 1].id}`)
    }
    prevCountRef.current = projects.length
  }, [projects, router])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setSubmitting(true)
    try {
      await addProject(newName.trim(), selectedColor)
      setDialogOpen(false)
      setNewName('')
      setSelectedColor(PRESET_COLORS[0])
    } finally {
      setSubmitting(false)
    }
  }

  // Show create-project prompt when no projects exist
  if (!loading && projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div
          className="flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
          style={{ background: 'var(--accent-bg)', border: '0.5px solid var(--accent-border)' }}
        >
          <IconNorthStar size={32} style={{ color: 'var(--accent)' }} aria-hidden />
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--tx-1)' }}>
          Create your first project
        </h2>
        <p className="text-sm mb-8 max-w-xs" style={{ color: 'var(--tx-3)' }}>
          lodestar organizes your work into projects. Create one to get started.
        </p>
        <Button onClick={() => setDialogOpen(true)} className="flex items-center gap-2">
          <IconPlus size={16} aria-hidden />
          New project
        </Button>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <Input
                placeholder="Project name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                aria-label="Project name"
                autoFocus
                required
              />
              <div>
                <p
                  className="text-[11px] font-medium uppercase tracking-widest mb-2"
                  style={{ color: 'var(--tx-3)' }}
                >
                  Color
                </p>
                <div className="flex gap-2" role="group" aria-label="Project color">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Color ${color}`}
                      aria-pressed={selectedColor === color}
                      onClick={() => setSelectedColor(color)}
                      className="w-7 h-7 rounded-full transition-all shrink-0"
                      style={{
                        background: color,
                        outline: selectedColor === color ? `2px solid ${color}` : 'none',
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !newName.trim()}>
                  {submitting ? 'Creating…' : 'Create project'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  const _d = new Date()
  const today = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const scopedTasks = activeProject ? tasks.filter(t => t.project_id === activeProject.id) : []

  const stats: { label: string; value: number }[] = [
    {
      label: 'Tasks due today',
      value: scopedTasks.filter(t => t.due_date === today && !t.is_archived).length,
    },
    {
      label: 'Overdue',
      value: scopedTasks.filter(
        t => t.due_date != null && t.due_date < today && t.status !== 'done' && !t.is_archived,
      ).length,
    },
    {
      label: 'Completed this week',
      value: scopedTasks.filter(t => t.status === 'done' && t.updated_at >= weekAgo).length,
    },
    {
      label: 'In progress',
      value: scopedTasks.filter(t => t.status === 'in_progress' && !t.is_archived).length,
    },
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-[var(--tx-1)] mb-1">Dashboard</h1>
      {activeProject && (
        <p className="text-sm mb-6" style={{ color: 'var(--tx-3)' }}>
          Showing stats for <span style={{ color: activeProject.color }}>{activeProject.name}</span>
        </p>
      )}
      {!activeProject && <div className="mb-6" />}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl p-4"
            style={{
              background: 'var(--surface)',
              border: '0.5px solid var(--border)',
            }}
          >
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--tx-3)] mb-2">
              {label}
            </p>
            <p className="text-2xl font-semibold text-[var(--tx-1)]">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
