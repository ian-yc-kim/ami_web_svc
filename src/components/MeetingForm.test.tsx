import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MeetingForm from './MeetingForm'

describe('MeetingForm', () => {
  it('shows error when notes length is less than 50 and prevents submit', async () => {
    const onSubmit = vi.fn()
    render(<MeetingForm onSubmit={onSubmit} />)

    const title = screen.getByLabelText(/Title/i)
    const date = screen.getByLabelText(/Date/i)
    const attendees = screen.getByLabelText(/Attendees/i)
    const notes = screen.getByLabelText(/Notes/i)
    const submit = screen.getByRole('button', { name: /save/i })

    fireEvent.change(title, { target: { value: 'Team Meeting' } })
    fireEvent.change(date, { target: { value: '2025-01-01T10:00' } })
    fireEvent.change(attendees, { target: { value: 'alice,bob' } })
    fireEvent.change(notes, { target: { value: 'Too short' } })

    fireEvent.click(submit)

    expect(await screen.findByText(/Notes must be at least 50 characters/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with parsed data when valid', async () => {
    const onSubmit = vi.fn(() => Promise.resolve())
    render(<MeetingForm onSubmit={onSubmit} />)

    const title = screen.getByLabelText(/Title/i)
    const date = screen.getByLabelText(/Date/i)
    const attendees = screen.getByLabelText(/Attendees/i)
    const notes = screen.getByLabelText(/Notes/i)
    const submit = screen.getByRole('button', { name: /save/i })

    const longNotes = 'This is a sufficiently long notes input that exceeds fifty characters in length.'

    fireEvent.change(title, { target: { value: 'Planning' } })
    fireEvent.change(date, { target: { value: '2025-02-02T09:30' } })
    fireEvent.change(attendees, { target: { value: 'alice, bob , carol' } })
    fireEvent.change(notes, { target: { value: longNotes } })

    fireEvent.click(submit)

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())

    const calledWith = (onSubmit as any).mock.calls[0]?.[0]
    expect(calledWith).toBeDefined()
    expect(calledWith.title).toBe('Planning')
    expect(Array.isArray(calledWith.attendees)).toBe(true)
    expect(calledWith.attendees.length).toBe(3)
    expect(calledWith.notes).toBe(longNotes.trim())
    expect(new Date(calledWith.date).toISOString()).toBeDefined()
  })
})
