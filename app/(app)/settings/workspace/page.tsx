'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/context/AuthContext'
import { useUI } from '@/lib/context/UIContext'
import { updateWorkspace } from '@/lib/workspace'

const PRESET_COLORS = [
  '#00B6EC',
  '#009AC8',
  '#007DA4',
  '#005F7D',
  '#7D99AA',
  '#5E7F91',
]

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'America/Honolulu',
  'America/Sao_Paulo',
  'America/Buenos_Aires',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Africa/Cairo',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
]

function formatTime(t: string): string {
  return t.slice(0, 5)
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg p-5 mb-4"
      style={{ background: 'var(--surface)', border: '0.5px solid var(--border-2)' }}
    >
      {children}
    </div>
  )
}

export default function WorkspaceSettingsPage() {
  const { workspace, member, setWorkspace } = useAuth()
  const { pushUndo } = useUI()

  const isOwner = member?.role === 'owner'

  const [name, setName] = useState(workspace?.name ?? '')
  const [nameError, setNameError] = useState('')
  const [nameSaving, setNameSaving] = useState(false)

  const [customHex, setCustomHex] = useState('')
  const [colorSaving, setColorSaving] = useState(false)

  const [timezoneSaving, setTimezoneSaving] = useState(false)

  const [endOfDay, setEndOfDay] = useState(
    workspace?.end_of_day_time ? formatTime(workspace.end_of_day_time) : '17:00'
  )
  const [endOfDaySaving, setEndOfDaySaving] = useState(false)

  if (!workspace) return null

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    if (!workspace) return
    const trimmed = name.trim()
    if (!trimmed) { setNameError('Name cannot be empty'); return }
    if (trimmed.length > 60) { setNameError('Name must be 60 characters or fewer'); return }
    setNameError('')
    const prev = workspace
    setWorkspace({ ...workspace, name: trimmed })
    setNameSaving(true)
    try {
      const updated = await updateWorkspace(workspace.id, { name: trimmed })
      setWorkspace(updated)
    } catch {
      setWorkspace(prev)
      setName(prev.name)
      pushUndo({ label: 'ws-name-err', message: 'Failed to save workspace name' })
    } finally {
      setNameSaving(false)
    }
  }

  async function handleColorPick(color: string) {
    if (!workspace) return
    const prev = workspace
    setWorkspace({ ...workspace, color })
    setColorSaving(true)
    try {
      const updated = await updateWorkspace(workspace.id, { color })
      setWorkspace(updated)
    } catch {
      setWorkspace(prev)
      pushUndo({ label: 'ws-color-err', message: 'Failed to save workspace color' })
    } finally {
      setColorSaving(false)
    }
  }

  async function handleTimezoneChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!workspace) return
    const timezone = e.target.value
    const prev = workspace
    setWorkspace({ ...workspace, timezone })
    setTimezoneSaving(true)
    try {
      const updated = await updateWorkspace(workspace.id, { timezone })
      setWorkspace(updated)
    } catch {
      setWorkspace(prev)
      pushUndo({ label: 'ws-tz-err', message: 'Failed to save timezone' })
    } finally {
      setTimezoneSaving(false)
    }
  }

  async function handleEndOfDayBlur() {
    if (!workspace || !endOfDay) return
    const prev = workspace
    setWorkspace({ ...workspace, end_of_day_time: endOfDay })
    setEndOfDaySaving(true)
    try {
      const updated = await updateWorkspace(workspace.id, { end_of_day_time: endOfDay })
      setWorkspace(updated)
    } catch {
      setWorkspace(prev)
      setEndOfDay(formatTime(prev.end_of_day_time))
      pushUndo({ label: 'ws-eod-err', message: 'Failed to save end-of-day time' })
    } finally {
      setEndOfDaySaving(false)
    }
  }

  if (!isOwner) {
    return (
      <div className="p-6 max-w-lg">
        <h1 className="text-xl font-semibold mb-6" style={{ color: 'var(--tx-1)' }}>
          Workspace
        </h1>
        <SectionCard>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--tx-3)' }}>Name</p>
          <p className="text-sm" style={{ color: 'var(--tx-1)' }}>{workspace.name}</p>
        </SectionCard>
        <SectionCard>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--tx-3)' }}>Color</p>
          <div
            className="w-6 h-6 rounded-full"
            style={{ background: workspace.color }}
            aria-label={`Workspace color ${workspace.color}`}
          />
        </SectionCard>
        <SectionCard>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--tx-3)' }}>Timezone</p>
          <p className="text-sm" style={{ color: 'var(--tx-1)' }}>{workspace.timezone}</p>
        </SectionCard>
        <SectionCard>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--tx-3)' }}>End of day</p>
          <p className="text-sm" style={{ color: 'var(--tx-1)' }}>
            {formatTime(workspace.end_of_day_time)}
          </p>
        </SectionCard>
        <p className="text-xs mt-2" style={{ color: 'var(--tx-3)' }}>
          Only workspace owners can edit these settings.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-xl font-semibold mb-6" style={{ color: 'var(--tx-1)' }}>
        Workspace
      </h1>

      {/* Name */}
      <SectionCard>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--tx-1)' }}>
          Workspace name
        </h2>
        <form onSubmit={handleSaveName} className="flex items-start gap-2">
          <div className="flex-1">
            <label htmlFor="ws-name" className="sr-only">Workspace name</label>
            <input
              id="ws-name"
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setNameError('') }}
              maxLength={60}
              className="w-full h-9 px-3 text-sm"
              style={{
                border: nameError ? '0.5px solid #EF4444' : '0.5px solid var(--border-2)',
                borderRadius: 'var(--radius)',
                background: 'var(--bg)',
                color: 'var(--tx-1)',
              }}
              aria-label="Workspace name"
            />
            {nameError && (
              <p className="text-xs mt-1" style={{ color: '#EF4444' }} role="alert">
                {nameError}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={nameSaving}
            className="text-sm px-3 py-1.5 rounded font-medium text-white shrink-0"
            style={{ background: '#00B6EC', borderRadius: 'var(--radius)' }}
          >
            {nameSaving ? 'Saving…' : 'Save'}
          </button>
        </form>
      </SectionCard>

      {/* Color */}
      <SectionCard>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--tx-1)' }}>
          Workspace color
        </h2>
        <div
          className="flex items-center gap-2 flex-wrap mb-3"
          role="group"
          aria-label="Workspace color"
        >
          {PRESET_COLORS.map(color => (
            <button
              key={color}
              type="button"
              aria-label={`Color ${color}`}
              aria-pressed={workspace.color === color}
              disabled={colorSaving}
              onClick={() => handleColorPick(color)}
              className="w-7 h-7 rounded-full transition-all shrink-0"
              style={{
                background: color,
                outline: workspace.color === color ? `2px solid ${color}` : 'none',
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label
            htmlFor="custom-hex"
            className="text-xs shrink-0"
            style={{ color: 'var(--tx-2)' }}
          >
            Custom hex
          </label>
          <input
            id="custom-hex"
            type="text"
            value={customHex}
            onChange={e => setCustomHex(e.target.value)}
            placeholder="#000000"
            className="w-28 h-8 px-2 text-sm font-mono"
            style={{
              border: '0.5px solid var(--border-2)',
              borderRadius: 'var(--radius)',
              background: 'var(--bg)',
              color: 'var(--tx-1)',
            }}
            aria-label="Custom hex color"
          />
          <button
            type="button"
            onClick={() => {
              const hex = customHex.trim()
              if (/^#[0-9a-fA-F]{6}$/.test(hex)) handleColorPick(hex)
            }}
            className="text-sm px-2 py-1 rounded"
            style={{
              background: 'var(--surface-2)',
              border: '0.5px solid var(--border-2)',
              color: 'var(--tx-2)',
              borderRadius: 'var(--radius)',
            }}
          >
            Apply
          </button>
        </div>
      </SectionCard>

      {/* Timezone */}
      <SectionCard>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--tx-1)' }}>
          Timezone
        </h2>
        <label htmlFor="timezone" className="sr-only">Timezone</label>
        <select
          id="timezone"
          value={workspace.timezone}
          onChange={handleTimezoneChange}
          disabled={timezoneSaving}
          className="w-full h-9 px-3 text-sm"
          style={{
            border: '0.5px solid var(--border-2)',
            borderRadius: 'var(--radius)',
            background: 'var(--bg)',
            color: 'var(--tx-1)',
          }}
          aria-label="Timezone"
        >
          {TIMEZONES.map(tz => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </SectionCard>

      {/* End of day */}
      <SectionCard>
        <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--tx-1)' }}>
          End of day
        </h2>
        <p className="text-xs mb-3" style={{ color: 'var(--tx-3)' }}>
          Tasks due today are highlighted after this time.
        </p>
        <label htmlFor="end-of-day" className="sr-only">End of day time</label>
        <input
          id="end-of-day"
          type="time"
          value={endOfDay}
          onChange={e => setEndOfDay(e.target.value)}
          onBlur={handleEndOfDayBlur}
          disabled={endOfDaySaving}
          className="h-9 px-3 text-sm"
          style={{
            border: '0.5px solid var(--border-2)',
            borderRadius: 'var(--radius)',
            background: 'var(--bg)',
            color: 'var(--tx-1)',
          }}
          aria-label="End of day time"
        />
      </SectionCard>
    </div>
  )
}
