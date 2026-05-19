import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { useState } from 'react'
import { SlashTextarea } from '@/components/editor/SlashTextarea'
import type { SlashCommand } from '@/components/editor/SlashCommandMenu'

// Wrapper that manages controlled state so the textarea re-renders correctly
function Fixture({
  onCommand = vi.fn(),
  initialValue = '',
}: {
  onCommand?: (cmd: SlashCommand, idx: number) => void
  initialValue?: string
}) {
  const [value, setValue] = useState(initialValue)
  return (
    <SlashTextarea
      value={value}
      onChange={setValue}
      onCommand={onCommand}
      aria-label="Description"
      placeholder="Add a description…"
      rows={3}
    />
  )
}

describe('SlashTextarea', () => {
  const onCommand = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a textarea with the given value', () => {
    render(<Fixture initialValue="hello" />)
    expect(screen.getByRole('textbox', { name: 'Description' })).toBeInTheDocument()
  })

  it('normal typing does not open the slash command menu', () => {
    render(<Fixture />)
    const textarea = screen.getByRole('textbox', { name: 'Description' })
    fireEvent.keyDown(textarea, { key: 'a' })
    fireEvent.change(textarea, { target: { value: 'a', selectionStart: 1 } })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('typing "/" opens the command menu with all three commands', () => {
    render(<Fixture />)
    const textarea = screen.getByRole('textbox', { name: 'Description' })
    // keyDown fires before the char is inserted; simulate cursor at pos 0
    fireEvent.keyDown(textarea, { key: '/' })
    fireEvent.change(textarea, { target: { value: '/', selectionStart: 1 } })
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByText('/ai')).toBeInTheDocument()
    expect(screen.getByText('/date')).toBeInTheDocument()
    expect(screen.getByText('/task')).toBeInTheDocument()
  })

  it('typing "/ai" filters the menu to the AI command', () => {
    render(<Fixture />)
    const textarea = screen.getByRole('textbox', { name: 'Description' })
    fireEvent.keyDown(textarea, { key: '/' })
    fireEvent.change(textarea, { target: { value: '/', selectionStart: 1 } })
    // Type 'a' after '/'
    fireEvent.change(textarea, { target: { value: '/a', selectionStart: 2 } })
    // Type 'i' — now query is 'ai'
    fireEvent.change(textarea, { target: { value: '/ai', selectionStart: 3 } })

    const menu = screen.getByRole('listbox')
    expect(within(menu).getByText('/ai')).toBeInTheDocument()
    expect(within(menu).queryByText('/date')).not.toBeInTheDocument()
    expect(within(menu).queryByText('/task')).not.toBeInTheDocument()
  })

  it('pressing Enter on a filtered command calls onCommand with that command', () => {
    render(<Fixture onCommand={onCommand} />)
    const textarea = screen.getByRole('textbox', { name: 'Description' })
    fireEvent.keyDown(textarea, { key: '/' })
    fireEvent.change(textarea, { target: { value: '/', selectionStart: 1 } })
    // Filter to /ai
    fireEvent.change(textarea, { target: { value: '/ai', selectionStart: 3 } })

    // Enter: textarea prevents default and lets it bubble; menu's window listener fires
    fireEvent.keyDown(textarea, { key: 'Enter' })

    expect(onCommand).toHaveBeenCalledWith(
      expect.objectContaining<Partial<SlashCommand>>({ id: 'ai' }),
      0  // triggerIndex
    )
  })

  it('Escape closes the menu without calling onCommand', () => {
    render(<Fixture onCommand={onCommand} />)
    const textarea = screen.getByRole('textbox', { name: 'Description' })
    fireEvent.keyDown(textarea, { key: '/' })
    fireEvent.change(textarea, { target: { value: '/', selectionStart: 1 } })
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.keyDown(textarea, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(onCommand).not.toHaveBeenCalled()
  })

  it('typing a space after "/" closes the menu', () => {
    render(<Fixture />)
    const textarea = screen.getByRole('textbox', { name: 'Description' })
    fireEvent.keyDown(textarea, { key: '/' })
    fireEvent.change(textarea, { target: { value: '/', selectionStart: 1 } })
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    // Space in the query closes the menu
    fireEvent.change(textarea, { target: { value: '/ ', selectionStart: 2 } })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('selecting a command via click strips the /query text and calls onCommand', async () => {
    render(<Fixture onCommand={onCommand} />)
    const textarea = screen.getByRole('textbox', { name: 'Description' })
    fireEvent.keyDown(textarea, { key: '/' })
    fireEvent.change(textarea, { target: { value: '/', selectionStart: 1 } })

    // Click on the /date option
    fireEvent.click(screen.getByRole('option', { name: /\/date/i }))

    await waitFor(() => {
      expect(onCommand).toHaveBeenCalledWith(
        expect.objectContaining<Partial<SlashCommand>>({ id: 'date' }),
        0
      )
    })
    // Menu should be closed
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
