'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  IconChevronDown,
  IconPlus,
  IconCheck,
  IconLayoutKanban,
} from '@tabler/icons-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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

const PRESET_COLORS = ['#00B6EC', '#FA9836', '#22C55E', '#8B5CF6', '#EF4444', '#66F4FF']

interface Props {
  collapsed: boolean
}

export function ProjectSwitcher({ collapsed }: Props) {
  const router = useRouter()
  const { projects, activeProject, addProject } = useProjects()
  const [open, setOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])
  const [submitting, setSubmitting] = useState(false)

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

  if (collapsed) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Switch project"
        className="flex items-center justify-center w-8 h-8 mx-auto rounded transition-colors hover:bg-white/[0.04]"
        style={{ color: activeProject?.color ?? '#7D99AA' }}
      >
        <IconLayoutKanban size={18} aria-hidden />
      </button>
    )
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            aria-label="Select project"
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors hover:bg-white/[0.04] focus-visible:outline-none"
          >
            {activeProject ? (
              <>
                <span
                  className="w-2.5 h-2.5 rounded-full flex-none"
                  style={{ background: activeProject.color }}
                  aria-hidden
                />
                <span className="flex-1 truncate text-left font-medium" style={{ color: '#E2EDF2' }}>
                  {activeProject.name}
                </span>
              </>
            ) : (
              <>
                <IconLayoutKanban size={14} className="flex-none" style={{ color: '#7D99AA' }} aria-hidden />
                <span className="flex-1 truncate text-left" style={{ color: '#7D99AA' }}>
                  Select project
                </span>
              </>
            )}
            <IconChevronDown size={12} className="flex-none" style={{ color: '#7D99AA' }} aria-hidden />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={4}
          className="p-1"
          style={{
            width: 224,
            background: '#0F2530',
            border: '0.5px solid #2C5060',
          }}
        >
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => {
                router.push(`/projects/${project.id}`)
                setOpen(false)
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors hover:bg-white/[0.06] text-left"
              style={{ color: '#E2EDF2' }}
            >
              <span
                className="w-2 h-2 rounded-full flex-none"
                style={{ background: project.color }}
                aria-hidden
              />
              <span className="flex-1 truncate">{project.name}</span>
              {activeProject?.id === project.id && (
                <IconCheck size={12} style={{ color: '#00B6EC' }} aria-hidden />
              )}
            </button>
          ))}

          {projects.length > 0 && (
            <div className="my-1" style={{ borderTop: '0.5px solid #2C5060' }} />
          )}

          <button
            onClick={() => { setOpen(false); setDialogOpen(true) }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors hover:bg-white/[0.06] text-left"
            style={{ color: '#7D99AA' }}
          >
            <IconPlus size={14} aria-hidden />
            New project
          </button>
        </PopoverContent>
      </Popover>

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
    </>
  )
}
