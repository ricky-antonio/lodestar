'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  IconChevronDown,
  IconCheck,
  IconLayoutKanban,
  IconPlus,
  IconFolders,
} from '@tabler/icons-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useProjects } from '@/lib/context/ProjectsContext'
import { useUI } from '@/lib/context/UIContext'

interface Props {
  collapsed: boolean
}

export function ProjectSwitcher({ collapsed }: Props) {
  const { projects, activeProject } = useProjects()
  const { openProjectCreate } = useUI()
  const [open, setOpen] = useState(false)

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
                {projects.length === 0 ? 'No projects yet' : 'Select project'}
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
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            onClick={() => setOpen(false)}
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
          </Link>
        ))}

        {projects.length > 0 && (
          <>
            <div className="my-1" style={{ borderTop: '0.5px solid #2C5060' }} />
            <Link
              href="/projects"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors hover:bg-white/[0.06] text-left"
              style={{ color: '#7D99AA' }}
            >
              <IconFolders size={14} aria-hidden />
              View all projects
            </Link>
          </>
        )}

        <div className="my-1" style={{ borderTop: '0.5px solid #2C5060' }} />
        <button
          onClick={() => { setOpen(false); openProjectCreate() }}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors hover:bg-white/[0.06] text-left"
          style={{ color: '#7D99AA' }}
        >
          <IconPlus size={14} aria-hidden />
          New project
        </button>
      </PopoverContent>
    </Popover>
  )
}
