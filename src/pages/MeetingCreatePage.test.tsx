import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Provide a navigate mock by mocking react-router-dom's hooks
const navigateMock = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../api/meetings', () => ({
  createMeeting: vi.fn(() => Promise.resolve({ id: 'm1' }))
}))

import MeetingCreatePage from './MeetingCreatePage'
import { createMeeting } from '../api/meetings'

describe('MeetingCreatePage', () => {
  it('calls createMeeting and navigates on success', async () => {
    render(
      <MemoryRouter>
        <MeetingCreatePage />
      </MemoryRouter>,
    )

    const title = screen.getByLabelText(/Title/i)
    const date = screen.getByLabelText(/Date/i)
    const attendees = screen.getByLabelText(/Attendees/i)
    const notes = screen.getByLabelText(/Notes/i)
    const submit = screen.getByRole('button', { name: /save/i })

    const longNotes = 'This is a sufficiently long notes input that exceeds fifty characters in length.'

    fireEvent.change(title, { target: { value: 'New Meeting' } })
    fireEvent.change(date, { target: { value: '2025-03-03T11:00' } })
    fireEvent.change(attendees, { target: { value: 'x,y' } })
    fireEvent.change(notes, { target: { value: longNotes } })

    fireEvent.click(submit)

    await waitFor(() => expect(createMeeting).toHaveBeenCalled())
    // navigation should have been invoked after success
    await waitFor(() => expect(navigateMock).toHaveBeenCalled())
  })
})
