import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { CommentThread } from '@/components/tasks/CommentThread'
import type { Comment } from '@/lib/comments'
import '@/tests/mocks/supabase'

const mockGetComments = vi.fn()
const mockAddComment = vi.fn()
const mockDeleteComment = vi.fn()
const mockRelativeTime = vi.fn()

vi.mock('@/lib/comments', () => ({
  getComments: (...args: unknown[]) => mockGetComments(...args),
  addComment: (...args: unknown[]) => mockAddComment(...args),
  deleteComment: (...args: unknown[]) => mockDeleteComment(...args),
}))

vi.mock('@/lib/relative-time', () => ({
  relativeTime: (...args: unknown[]) => mockRelativeTime(...args),
}))

function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 'c-1',
    task_id: 't-1',
    user_id: 'u-1',
    body: 'Hello world',
    created_at: '2026-01-01T00:00:00Z',
    profile: { display_name: 'Alice', avatar_url: null },
    ...overrides,
  }
}

const DEFAULT_PROPS = { taskId: 't-1', workspaceId: 'ws-1', userId: 'u-1' }

describe('CommentThread', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRelativeTime.mockReturnValue('just now')
  })

  it('renders existing comments with display name and body', async () => {
    mockGetComments.mockResolvedValueOnce([
      makeComment({ id: 'c-1', body: 'First comment', profile: { display_name: 'Alice', avatar_url: null } }),
      makeComment({ id: 'c-2', body: 'Second comment', profile: { display_name: 'Bob', avatar_url: null } }),
    ])
    render(<CommentThread {...DEFAULT_PROPS} />)
    await waitFor(() => expect(screen.getByText('First comment')).toBeInTheDocument())
    expect(screen.getByText('Second comment')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows relativeTime for each comment', async () => {
    mockGetComments.mockResolvedValueOnce([makeComment()])
    mockRelativeTime.mockReturnValue('5 minutes ago')
    render(<CommentThread {...DEFAULT_PROPS} />)
    await waitFor(() => expect(screen.getByText('5 minutes ago')).toBeInTheDocument())
  })

  it('shows delete button only on own comments', async () => {
    mockGetComments.mockResolvedValueOnce([
      makeComment({ id: 'c-own', user_id: 'u-1' }),  // own
      makeComment({ id: 'c-other', user_id: 'u-other', body: 'Other comment' }),  // not own
    ])
    render(<CommentThread {...DEFAULT_PROPS} userId="u-1" />)
    await waitFor(() => expect(screen.getByText('Hello world')).toBeInTheDocument())

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete comment' })
    expect(deleteButtons).toHaveLength(1)
  })

  it('delete button calls deleteComment and removes comment optimistically', async () => {
    mockGetComments.mockResolvedValueOnce([makeComment({ id: 'c-1', user_id: 'u-1' })])
    mockDeleteComment.mockResolvedValueOnce(undefined)

    render(<CommentThread {...DEFAULT_PROPS} />)
    await waitFor(() => expect(screen.getByText('Hello world')).toBeInTheDocument())

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete comment' }))
    })

    expect(mockDeleteComment).toHaveBeenCalledWith('c-1')
    await waitFor(() => expect(screen.queryByText('Hello world')).not.toBeInTheDocument())
  })

  it('typing and submitting calls addComment and clears the input', async () => {
    mockGetComments.mockResolvedValueOnce([])
    const saved = makeComment({ id: 'c-saved', body: 'New comment' })
    mockAddComment.mockResolvedValueOnce(saved)

    render(<CommentThread {...DEFAULT_PROPS} />)
    await waitFor(() => screen.getByRole('textbox', { name: 'New comment' }))

    fireEvent.change(screen.getByRole('textbox', { name: 'New comment' }), {
      target: { value: 'New comment' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit comment' }))
    })

    expect(mockAddComment).toHaveBeenCalledWith('ws-1', 't-1', 'u-1', 'New comment')
    await waitFor(() =>
      expect((screen.getByRole('textbox', { name: 'New comment' }) as HTMLTextAreaElement).value).toBe('')
    )
  })

  it('reverts optimistic add on addComment error', async () => {
    mockGetComments.mockResolvedValueOnce([])
    mockAddComment.mockRejectedValueOnce(new Error('network error'))

    render(<CommentThread {...DEFAULT_PROPS} />)
    await waitFor(() => screen.getByRole('textbox', { name: 'New comment' }))

    fireEvent.change(screen.getByRole('textbox', { name: 'New comment' }), {
      target: { value: 'Failing comment' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit comment' }))
    })

    // Optimistic comment paragraph should be removed on failure — "No comments yet." reappears
    await waitFor(() =>
      expect(screen.getByText('No comments yet.')).toBeInTheDocument()
    )
    // Body should be restored in the textarea
    expect((screen.getByRole('textbox', { name: 'New comment' }) as HTMLTextAreaElement).value).toBe('Failing comment')
  })
})
