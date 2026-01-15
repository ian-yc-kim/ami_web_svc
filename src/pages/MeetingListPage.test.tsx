/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import MeetingListPage, { sortMeetingsByDateDesc, formatAttendeesSummary } from './MeetingListPage'
import * as meetingsApi from '../api/meetings'

vi.mock('../api/meetings')

describe('MeetingListPage', () => {
  const api = meetingsApi as any

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('shows loading state while fetching', async () => {
    // create a promise that doesn't resolve to simulate loading
    let resolve!: (value?: unknown) => void
    const p = new Promise((res) => {
      resolve = res
    })
    api.getMeetings.mockReturnValue(p)

    render(
      <AuthContext.Provider value={{ user: { id: 'u1' }, isAuthenticated: true, isLoading: false, login: async () => {}, logout: async () => {} } as any}>
        <MemoryRouter>
          <MeetingListPage />
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    expect(screen.getByRole('status')).toHaveTextContent(/Loading meetings/i)

    // cleanup: resolve to avoid unresolved promise warnings
    resolve([])
  })

  it('renders meetings sorted by date descending and attendee summary', async () => {
    const mockData = [
      { id: '1', title: 'Old', date: '2020-01-01T00:00:00Z', attendees: ['A'], notes: '' },
      { id: '2', title: 'Newest', date: '2030-01-01T00:00:00Z', attendees: ['A', 'B', 'C', 'D'], notes: '' },
      { id: '3', title: 'Middle', date: '2025-01-01T00:00:00Z', attendees: ['A', 'B'], notes: '' },
    ]
    api.getMeetings.mockResolvedValue(mockData)

    render(
      <AuthContext.Provider value={{ user: { id: 'u1' }, isAuthenticated: true, isLoading: false, login: async () => {}, logout: async () => {} } as any}>
        <MemoryRouter>
          <MeetingListPage />
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    const items = await screen.findAllByTestId('meeting-item')
    expect(items).toHaveLength(3)
    // First item should be the Newest meeting
    expect(items[0]).toHaveTextContent(/Newest/)
    expect(items[1]).toHaveTextContent(/Middle/)
    expect(items[2]).toHaveTextContent(/Old/)

    // attendee summary for the 2nd item (Newest) should show +2 style
    expect(items[0]).toHaveTextContent(/\(\+2\)/)

    // each item should have a link to its detail
    const links = items.map((li) => li.querySelector('a'))
    expect(links.every((l) => l && (l as HTMLAnchorElement).href.includes('/meetings/'))).toBeTruthy()
  })

  it('shows error when fetch fails', async () => {
    api.getMeetings.mockRejectedValue(new Error('Network'))

    render(
      <AuthContext.Provider value={{ user: { id: 'u1' }, isAuthenticated: true, isLoading: false, login: async () => {}, logout: async () => {} } as any}>
        <MemoryRouter>
          <MeetingListPage />
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/Failed to load meetings/i)
  })

  it('utility functions behave correctly', () => {
    const arr = [
      { id: '1', title: 'a', date: '2020-01-02', attendees: [], notes: '' },
      { id: '2', title: 'b', date: '2020-01-01', attendees: [], notes: '' },
    ]
    const sorted = sortMeetingsByDateDesc(arr)
    expect(sorted[0].id).toBe('1')

    expect(formatAttendeesSummary([])).toBe('No attendees')
    expect(formatAttendeesSummary(['A'])).toBe('A')
    expect(formatAttendeesSummary(['A', 'B', 'C', 'D'])).toBe('A, B (+2)')
  })
})
