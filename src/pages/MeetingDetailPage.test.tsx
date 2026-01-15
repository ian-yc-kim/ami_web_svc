/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import MeetingDetailPage from './MeetingDetailPage'
import * as meetingsApi from '../api/meetings'

vi.mock('../api/meetings')

describe('MeetingDetailPage', () => {
  const api = meetingsApi as any

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('shows loading state while fetching', async () => {
    let resolve!: (value?: unknown) => void
    const p = new Promise((res) => {
      resolve = res
    })
    api.getMeeting.mockReturnValue(p)

    render(
      <AuthContext.Provider value={{ user: { id: 'u1' }, isAuthenticated: true, isLoading: false, login: async () => {}, logout: async () => {} } as any}>
        <MemoryRouter initialEntries={["/meetings/m1"]}>
          <Routes>
            <Route path="/meetings/:id" element={<MeetingDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    expect(screen.getByRole('status')).toHaveTextContent(/Loading meeting/i)

    resolve({})
  })

  it('renders meeting details on success', async () => {
    const mockMeeting = {
      id: 'm1',
      title: 'Team Sync',
      date: '2024-01-01T12:00:00Z',
      attendees: ['Alice', 'Bob'],
      notes: 'Discuss Q1',
    }
    api.getMeeting.mockResolvedValue(mockMeeting)

    render(
      <AuthContext.Provider value={{ user: { id: 'u1' }, isAuthenticated: true, isLoading: false, login: async () => {}, logout: async () => {} } as any}>
        <MemoryRouter initialEntries={["/meetings/m1"]}>
          <Routes>
            <Route path="/meetings/:id" element={<MeetingDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    expect(await screen.findByRole('heading', { level: 2 })).toHaveTextContent(/Team Sync/i)
    expect(screen.getByText(/2024-01-01/i)).toBeInTheDocument()
    expect(screen.getByText(/Alice/)).toBeInTheDocument()
    expect(screen.getByText(/Bob/)).toBeInTheDocument()
    expect(screen.getByText(/Discuss Q1/)).toBeInTheDocument()

    // edit link exists
    expect(screen.getByText(/Edit/)).toBeInTheDocument()
  })

  it('shows error when fetch fails', async () => {
    api.getMeeting.mockRejectedValue(new Error('Not found'))

    render(
      <AuthContext.Provider value={{ user: { id: 'u1' }, isAuthenticated: true, isLoading: false, login: async () => {}, logout: async () => {} } as any}>
        <MemoryRouter initialEntries={["/meetings/missing"]}>
          <Routes>
            <Route path="/meetings/:id" element={<MeetingDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/Meeting not found/i)
  })

  it('handles missing id param gracefully', () => {
    render(
      <AuthContext.Provider value={{ user: { id: 'u1' }, isAuthenticated: true, isLoading: false, login: async () => {}, logout: async () => {} } as any}>
        <MemoryRouter initialEntries={["/meetings"]}>
          <Routes>
            <Route path="/meetings" element={<MeetingDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/Meeting not found/i)
  })

  it('renders review button and opens modal with items on click', async () => {
    const mockMeeting = {
      id: 'm1',
      title: 'Team Sync',
      date: '2024-01-01T12:00:00Z',
      attendees: ['Alice', 'Bob'],
      notes: 'Discuss Q1',
    }

    // Prepare a deferred promise to assert loading/disabled state
    let resolveAnalyze!: (value?: unknown) => void
    const analyzePromise = new Promise((res) => {
      resolveAnalyze = res
    })

    api.getMeeting.mockResolvedValue(mockMeeting)
    api.analyzeMeeting.mockReturnValue(analyzePromise)

    render(
      <AuthContext.Provider value={{ user: { id: 'u1' }, isAuthenticated: true, isLoading: false, login: async () => {}, logout: async () => {} } as any}>
        <MemoryRouter initialEntries={["/meetings/m1"]}>
          <Routes>
            <Route path="/meetings/:id" element={<MeetingDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    const btn = await screen.findByRole('button', { name: /review action items/i })
    expect(btn).toBeInTheDocument()

    // click triggers analyze and should disable while pending
    await userEvent.click(btn)
    expect(btn).toBeDisabled()

    // resolve analyze with suggested action items
    const analysisResult = {
      summary: '',
      keyDiscussionPoints: [],
      decisions: [],
      suggestedActionItems: [
        { description: 'Do X', assignee: 'Alice', dueDate: '2024-02-01T00:00:00Z' },
      ],
    }
    // resolve the deferred promise
    resolveAnalyze(analysisResult)

    // wait for modal to appear
    const dialog = await screen.findByRole('dialog', { name: /review action items/i })
    expect(dialog).toBeInTheDocument()

    // verify analyzeMeeting called with meeting id
    expect(api.analyzeMeeting).toHaveBeenCalledWith('m1')

    // verify prefilled values
    const descInputs = screen.getAllByLabelText(/description/i)
    expect(descInputs[0]).toHaveValue('Do X')
    const assigneeInputs = screen.getAllByLabelText(/assignee/i)
    expect(assigneeInputs[0]).toHaveValue('Alice')
    const dueInputs = screen.getAllByLabelText(/due date/i)
    expect(dueInputs[0]).toHaveValue('2024-02-01')
  })
})
