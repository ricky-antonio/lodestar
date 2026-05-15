'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useProjects } from '@/lib/context/ProjectsContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IconChevronRight } from '@tabler/icons-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

const PRESET_COLORS = [
  '#00B6EC',
  '#FA9836',
  '#22C55E',
  '#8B5CF6',
  '#EF4444',
  '#66F4FF',
]

export default function ProjectsPage() {
  const { projects, loading, addProject } = useProjects()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])
  const [submitting, setSubmitting] = useState(false)

  function openDialog() {
    setNewName('')
    setSelectedColor(PRESET_COLORS[0])
    setDialogOpen(true)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setSubmitting(true)
    try {
      await addProject(newName.trim(), selectedColor)
      setDialogOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--tx-1)' }}>
          Projects
        </h1>
        <Button onClick={openDialog}>New project</Button>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--tx-3)' }}>Loading…</p>
      ) : projects.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--tx-3)' }}>
          No projects yet. Create your first project.
        </p>
      ) : (
        <div className="space-y-2">
          {projects.map(project => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex items-center gap-4 px-4 py-3 rounded-xl transition-colors hover:brightness-110"
              style={{
                background: 'var(--surface)',
                border: '0.5px solid var(--border)',
                borderLeft: `3px solid ${project.color}`,
              }}
            >
              <span className="flex-1 text-sm font-medium" style={{ color: 'var(--tx-1)' }}>
                {project.name}
              </span>
              <IconChevronRight size={16} style={{ color: 'var(--tx-3)' }} aria-hidden />
            </Link>
          ))}
        </div>
      )}

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
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
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
