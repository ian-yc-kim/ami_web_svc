import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import * as RRDOM from 'react-router-dom'

const sampleMeeting = {
  id: 'm1',
  title: 'Standup',
  date: '2025-04-04T08:00:00.000Z',
  attendees: ['alice', 'bob'],
  notes: 'This is a long enough notes string that passes validation requirement which is fifty characters.'
}

vi.mock('../api/meetings', () => ({
  getMeeting: vi.fn(() => Promise.resolve(sampleMeeting)),
  updateMeeting: vi.fn(() => Promise.resolve(sampleMeeting)),
}))

import MeetingEditPage from './MeetingEditPage'
import { getMeeting, updateMeeting } from '../api/meetings'

describe('MeetingEditPage', () => {
  it('loads meeting, populates form, updates and navigates', async () => {
    const navigateMock = vi.fn()
    // Spy on useNavigate and useParams to control routing behavior
    vi.spyOn(RRDOM, 'useNavigate').mockReturnValue(navigateMock as any)
    vi.spyOn(RRDOM, 'useParams').mockReturnValue({ id: 'm1' } as any)

    render(
      <MemoryRouter>
        <MeetingEditPage />
      </MemoryRouter>,
    )

    // Wait for loaded data
    await waitFor(() => expect(getMeeting).toHaveBeenCalled())

    const title = screen.getByLabelText(/Title/i) as HTMLInputElement
    expect(title.value).toBe('Standup')

    const submit = screen.getByRole('button', { name: /save/i })
    fireEvent.click(submit)

    await waitFor(() => expect(updateMeeting).toHaveBeenCalled())
    await waitFor(() => expect(navigateMock).toHaveBeenCalled())
  })
})
