export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-[var(--tx-1)] mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['Tasks due today', 'Overdue', 'Completed this week', 'In progress'].map(label => (
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
            <p className="text-2xl font-semibold text-[var(--tx-1)]">—</p>
          </div>
        ))}
      </div>
    </div>
  )
}
