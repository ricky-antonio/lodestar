'use client'

import { useEffect, useRef, useState } from 'react'
import { IconTrash, IconSend } from '@tabler/icons-react'
import { getComments, addComment, deleteComment, type Comment } from '@/lib/comments'
import { relativeTime } from '@/lib/relative-time'

interface Props {
  taskId: string
  workspaceId: string
  userId: string
}

function Avatar({ name, url }: { name: string | null; url: string | null }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name ?? 'User'}
        className="w-7 h-7 rounded-full shrink-0 object-cover"
      />
    )
  }
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-semibold select-none"
      style={{ background: 'var(--surface-2)', color: 'var(--tx-2)' }}
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}

export function CommentThread({ taskId, workspaceId, userId }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    getComments(taskId).then(setComments).catch(() => {})
  }, [taskId])

  async function handleSubmit() {
    const trimmed = body.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    setBody('')

    const optimistic: Comment = {
      id: `optimistic-${Date.now()}`,
      task_id: taskId,
      user_id: userId,
      body: trimmed,
      created_at: new Date().toISOString(),
      profile: { display_name: null, avatar_url: null },
    }
    setComments(prev => [...prev, optimistic])

    try {
      const saved = await addComment(workspaceId, taskId, userId, trimmed)
      setComments(prev => prev.map(c => c.id === optimistic.id ? saved : c))
    } catch {
      setComments(prev => prev.filter(c => c.id !== optimistic.id))
      setBody(trimmed)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    setComments(prev => prev.filter(c => c.id !== id))
    try {
      await deleteComment(id)
    } catch {
      getComments(taskId).then(setComments).catch(() => {})
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {comments.length === 0 && (
        <p className="text-sm text-[var(--tx-3)]">No comments yet.</p>
      )}

      {comments.map(comment => (
        <div key={comment.id} className="flex gap-2 items-start">
          <Avatar name={comment.profile.display_name} url={comment.profile.avatar_url} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium text-[var(--tx-1)]">
                {comment.profile.display_name ?? 'Unknown'}
              </span>
              <span className="text-[11px] text-[var(--tx-3)]">
                {relativeTime(comment.created_at)}
              </span>
            </div>
            <p className="text-sm text-[var(--tx-2)] mt-0.5 break-words">{comment.body}</p>
          </div>
          {comment.user_id === userId && (
            <button
              onClick={() => handleDelete(comment.id)}
              className="p-1 rounded hover:bg-[var(--surface-2)] text-[var(--tx-3)] hover:text-red-500 transition-colors shrink-0 mt-0.5"
              aria-label="Delete comment"
            >
              <IconTrash size={13} />
            </button>
          )}
        </div>
      ))}

      <div className="flex gap-2 mt-1 items-end">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="Write a comment… (Ctrl+Enter to submit)"
          aria-label="New comment"
          className={[
            'flex-1 px-3 py-2 rounded-[var(--radius)] resize-none text-sm',
            'border border-[var(--border-2)] bg-[var(--surface)]',
            'text-[var(--tx-1)] placeholder:text-[var(--tx-3)]',
            'focus:outline-none focus:border-[var(--accent)]',
            'focus:shadow-[0_0_0_3px_var(--focus-ring)]',
          ].join(' ')}
        />
        <button
          onClick={handleSubmit}
          disabled={!body.trim() || submitting}
          className="h-8 w-8 rounded-[var(--radius)] flex items-center justify-center transition-colors disabled:opacity-40"
          style={{ background: 'var(--accent)', color: '#fff' }}
          aria-label="Submit comment"
        >
          <IconSend size={14} />
        </button>
      </div>
    </div>
  )
}
