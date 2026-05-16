'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useProjects } from '@/lib/context/ProjectsContext'
import { useUI } from '@/lib/context/UIContext'

const PRESET_COLORS = ['#00B6EC', '#FA9836', '#22C55E', '#8B5CF6', '#EF4444', '#66F4FF']

export function CreateProjectDialog() {
  const router = useRouter()
  const { addProject } = useProjects()
  const { projectCreateOpen, closeProjectCreate } = useUI()

  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [submitting, setSubmitting] = useState(false)

  function handleOpenChange(open: boolean) {
    if (!open) {
      closeProjectCreate()
      setName('')
      setColor(PRESET_COLORS[0])
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await addProject(name.trim(), color)
      closeProjectCreate()
      setName('')
      setColor(PRESET_COLORS[0])
      // addProject sets the optimistic project; navigate to projects list
      router.push('/projects')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={projectCreateOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 mt-2">
          <Input
            placeholder="Project name"
            value={name}
            onChange={e => setName(e.target.value)}
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
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  aria-pressed={color === c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-all shrink-0"
                  style={{
                    background: c,
                    outline: color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? 'Creating…' : 'Create project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
