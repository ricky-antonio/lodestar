import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CreateProjectDialog } from '@/components/layout/CreateProjectDialog'

const mockPush = vi.fn()
const mockAddProject = vi.fn()
const mockCloseProjectCreate = vi.fn()
const mockProjectCreateOpen = vi.hoisted(() => ({ value: false }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/lib/context/ProjectsContext', () => ({
  useProjects: () => ({ addProject: mockAddProject }),
}))

vi.mock('@/lib/context/UIContext', () => ({
  useUI: () => ({
    projectCreateOpen: mockProjectCreateOpen.value,
    closeProjectCreate: mockCloseProjectCreate,
  }),
}))

function renderDialog(open = true) {
  mockProjectCreateOpen.value = open
  return render(<CreateProjectDialog />)
}

describe('CreateProjectDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAddProject.mockResolvedValue('new-project-id')
  })

  it('renders dialog when open', () => {
    renderDialog(true)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('New project')).toBeInTheDocument()
  })

  it('cancel button calls closeProjectCreate', () => {
    renderDialog(true)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockCloseProjectCreate).toHaveBeenCalled()
  })

  it('submit calls addProject with name and selected color', async () => {
    renderDialog(true)
    fireEvent.change(screen.getByRole('textbox', { name: /project name/i }), {
      target: { value: 'My Project' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create project/i }))
    await waitFor(() => {
      expect(mockAddProject).toHaveBeenCalledWith('My Project', '#00B6EC')
    })
  })

  it('navigates to new project after creation', async () => {
    renderDialog(true)
    fireEvent.change(screen.getByRole('textbox', { name: /project name/i }), {
      target: { value: 'Alpha' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create project/i }))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/projects/new-project-id')
    })
  })

  it('navigates to /projects when addProject returns null', async () => {
    mockAddProject.mockResolvedValue(null)
    renderDialog(true)
    fireEvent.change(screen.getByRole('textbox', { name: /project name/i }), {
      target: { value: 'Alpha' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create project/i }))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/projects')
    })
  })

  it('selecting a color swatch changes the color', () => {
    renderDialog(true)
    const swatches = screen.getAllByRole('button', { name: /^Color #/i })
    fireEvent.click(swatches[1]) // second color
    expect(swatches[1]).toHaveAttribute('aria-pressed', 'true')
  })

  it('submit button disabled when name is empty', () => {
    renderDialog(true)
    expect(screen.getByRole('button', { name: /create project/i })).toBeDisabled()
  })
})
