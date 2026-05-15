'use client'

import { useTasks } from '@/lib/context/TasksContext'

export default function DashboardPage() {
  const { tasks } = useTasks()

  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const stats: { label: string; value: number }[] = [
    {
      label: 'Tasks due today',
      value: tasks.filter(t => t.due_date === today && !t.is_archived).length,
    },
    {
      label: 'Overdue',
      value: tasks.filter(
        t => t.due_date != null && t.due_date < today && t.status !== 'done' && !t.is_archived,
      ).length,
    },
    {
      label: 'Completed this week',
      value: tasks.filter(t => t.status === 'done' && t.updated_at >= weekAgo).length,
    },
    {
      label: 'In progress',
      value: tasks.filter(t => t.status === 'in_progress' && !t.is_archived).length,
    },
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-[var(--tx-1)] mb-6">Dashboard</h1>
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
