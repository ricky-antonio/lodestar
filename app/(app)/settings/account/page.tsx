'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { updateEmail, sendPasswordReset, deleteAccount } from '@/lib/auth'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg p-5 mb-4"
      style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border-2)',
      }}
    >
      {children}
    </div>
  )
}

export default function AccountSettingsPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const isGoogleOnly = !user?.identities?.some(i => i.provider === 'email')

  // Email section
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sent' | 'error'>('idle')
  const [emailLoading, setEmailLoading] = useState(false)

  // Password section
  const [passwordSent, setPasswordSent] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Delete section
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function handleSendEmailConfirmation(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail.trim()) return
    setEmailLoading(true)
    setEmailStatus('idle')
    try {
      await updateEmail(newEmail.trim())
      setEmailStatus('sent')
    } catch {
      // Never reveal whether an email is already registered
      setEmailStatus('sent')
    } finally {
      setEmailLoading(false)
    }
  }

  async function handlePasswordChange() {
    if (!user?.email) return
    setPasswordLoading(true)
    try {
      await sendPasswordReset(user.email)
      setPasswordSent(true)
    } finally {
      setPasswordLoading(false)
    }
  }

  async function handleDeleteConfirm() {
    if (!user) return
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await deleteAccount(user.id)
      await signOut()
      router.push('/login?deleted=true')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account')
      setDeleteLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-xl font-semibold mb-6" style={{ color: 'var(--tx-1)' }}>
        Account
      </h1>

      {/* Email */}
      <SectionCard>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--tx-1)' }}>
          Email address
        </h2>
        <p className="text-sm mb-3" style={{ color: 'var(--tx-2)' }}>
          {user?.email}
        </p>

        {!showEmailForm ? (
          <button
            onClick={() => { setShowEmailForm(true); setEmailStatus('idle') }}
            className="text-sm px-3 py-1.5 rounded transition-colors"
            style={{
              background: 'var(--surface-2)',
              border: '0.5px solid var(--border-2)',
              color: 'var(--tx-1)',
              borderRadius: 'var(--radius)',
            }}
          >
            Change email
          </button>
        ) : (
          <form onSubmit={handleSendEmailConfirmation} className="space-y-3">
            <div>
              <label
                htmlFor="new-email"
                className="block text-xs font-medium mb-1"
                style={{ color: 'var(--tx-2)' }}
              >
                New email address
              </label>
              <input
                id="new-email"
                type="email"
                required
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="w-full h-9 px-3 text-sm"
                style={{
                  border: '0.5px solid var(--border-2)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--bg)',
                  color: 'var(--tx-1)',
                }}
                placeholder="new@example.com"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={emailLoading}
                className="text-sm px-3 py-1.5 rounded text-white font-medium"
                style={{ background: '#00B6EC', borderRadius: 'var(--radius)' }}
              >
                {emailLoading ? 'Sending…' : 'Send confirmation'}
              </button>
              <button
                type="button"
                onClick={() => { setShowEmailForm(false); setEmailStatus('idle'); setNewEmail('') }}
                className="text-sm px-3 py-1.5 rounded"
                style={{ color: 'var(--tx-2)' }}
              >
                Cancel
              </button>
            </div>
            {emailStatus === 'sent' && (
              <p className="text-sm" style={{ color: '#22C55E' }}>
                Confirmation sent to {newEmail}
              </p>
            )}
          </form>
        )}
      </SectionCard>

      {/* Password */}
      <SectionCard>
        <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--tx-1)' }}>
          {isGoogleOnly ? 'Set a password' : 'Password'}
        </h2>
        <p className="text-sm mb-3" style={{ color: 'var(--tx-2)' }}>
          {isGoogleOnly
            ? 'Add a password to sign in with email.'
            : 'Send a password reset link to your email.'}
        </p>

        {passwordSent ? (
          <p className="text-sm" style={{ color: '#22C55E' }}>
            Reset link sent to your email
          </p>
        ) : (
          <button
            onClick={handlePasswordChange}
            disabled={passwordLoading}
            className="text-sm px-3 py-1.5 rounded transition-colors"
            style={{
              background: 'var(--surface-2)',
              border: '0.5px solid var(--border-2)',
              color: 'var(--tx-1)',
              borderRadius: 'var(--radius)',
            }}
          >
            {passwordLoading
              ? 'Sending…'
              : isGoogleOnly
              ? 'Set a password'
              : 'Change password'}
          </button>
        )}
      </SectionCard>

      {/* Danger zone */}
      <div
        className="rounded-lg p-5"
        style={{ border: '1px solid #EF4444' }}
      >
        <h2 className="text-sm font-semibold mb-1" style={{ color: '#EF4444' }}>
          Danger zone
        </h2>
        <p className="text-sm mb-3" style={{ color: 'var(--tx-2)' }}>
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <button
          onClick={() => { setDeleteOpen(true); setDeleteConfirm(''); setDeleteError('') }}
          className="text-sm px-3 py-1.5 rounded font-medium"
          style={{
            border: '1px solid #EF4444',
            color: '#EF4444',
            borderRadius: 'var(--radius)',
          }}
        >
          Delete account
        </button>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={open => { if (!deleteLoading) setDeleteOpen(open) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: 'var(--tx-2)' }}>
            This will permanently delete your account and all data. Type{' '}
            <strong style={{ color: 'var(--tx-1)' }}>delete</strong> to confirm.
          </p>
          <input
            type="text"
            value={deleteConfirm}
            onChange={e => { setDeleteConfirm(e.target.value); setDeleteError('') }}
            placeholder="delete"
            className="w-full h-9 px-3 text-sm mt-2"
            style={{
              border: '0.5px solid var(--border-2)',
              borderRadius: 'var(--radius)',
              background: 'var(--bg)',
              color: 'var(--tx-1)',
            }}
            aria-label="Type delete to confirm"
          />
          {deleteError && (
            <p className="text-sm mt-1" style={{ color: '#EF4444' }} role="alert">
              {deleteError}
            </p>
          )}
          <DialogFooter>
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteLoading}
              className="text-sm px-4 py-2 rounded"
              style={{
                background: 'var(--surface-2)',
                border: '0.5px solid var(--border-2)',
                color: 'var(--tx-1)',
                borderRadius: 'var(--radius)',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={deleteConfirm !== 'delete' || deleteLoading}
              className="text-sm px-4 py-2 rounded font-medium text-white"
              style={{
                background: deleteConfirm === 'delete' && !deleteLoading ? '#EF4444' : '#9CA3AF',
                borderRadius: 'var(--radius)',
              }}
              aria-disabled={deleteConfirm !== 'delete' || deleteLoading}
            >
              {deleteLoading ? 'Deleting…' : 'Delete account'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
