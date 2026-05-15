'use client'

import { useEffect, useRef, useState } from 'react'
import { IconX } from '@tabler/icons-react'
import { useUI, type UndoItem } from '@/lib/context/UIContext'

function ToastItem({ item, onDismiss }: { item: UndoItem; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  useEffect(() => {
    const enterTimer = setTimeout(() => setVisible(true), 10)
    const dismissTimer = setTimeout(() => onDismissRef.current(), 5000)
    return () => {
      clearTimeout(enterTimer)
      clearTimeout(dismissTimer)
    }
  }, [])

  const handleUndo = () => {
    item.undo?.()
    onDismiss()
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 min-w-[280px] max-w-sm ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
      style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <span className="flex-1 text-sm" style={{ color: 'var(--tx-1)' }}>
        {item.message ?? item.label}
      </span>
      {item.undo && item.canUndo !== false && (
        <button
          onClick={handleUndo}
          className="text-sm font-medium shrink-0"
          style={{ color: 'var(--accent)' }}
        >
          Undo
        </button>
      )}
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 p-1 rounded"
        style={{ color: 'var(--tx-3)' }}
      >
        <IconX size={16} />
      </button>
    </div>
  )
}

export function Toast() {
  const { undoStack, dismissUndo } = useUI()

  if (undoStack.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {undoStack.map((item) => (
        <ToastItem
          key={item.label}
          item={item}
          onDismiss={() => dismissUndo(item.label)}
        />
      ))}
    </div>
  )
}
