/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import MeetingDetailPage from './MeetingDetailPage'
import * as meetingsApi from '../api/meetings'
import * as actionItemsApi from '../api/actionItems'

vi.mock('../api/meetings')
vi.mock('../api/actionItems')

describe('MeetingDetailPage', () => {
  const api = meetingsApi as any
  const actionApi = actionItemsApi as any

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

  it('renders meeting details on success and shows action items section', async () => {
    const mockMeeting = {
      id: 'm1',
      title: 'Team Sync',
      date: '2024-01-01T12:00:00Z',
      attendees: ['Alice', 'Bob'],
      notes: 'Discuss Q1',
    }
    api.getMeeting.mockResolvedValue(mockMeeting)
    actionApi.getActionItems.mockResolvedValue([])

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

    // action items section present
    expect(screen.getByRole('heading', { name: /Action Items/i })).toBeInTheDocument()
    expect(actionApi.getActionItems).toHaveBeenCalledWith('m1')

    // edit link exists
    expect(screen.getByText(/Edit/)).toBeInTheDocument()
  })

  it('status change calls updateActionItem and refreshes list', async () => {
    const mockMeeting = {
      id: 'm1',
      title: 'Team Sync',
      date: '2024-01-01T12:00:00Z',
      attendees: ['Alice'],
      notes: 'Notes',
    }

    const item = {
      id: 'ai1',
      meetingId: 'm1',
      description: 'Do X',
      status: 'To Do',
    }

    const updatedItem = { ...item, status: 'Done' }

    api.getMeeting.mockResolvedValue(mockMeeting)
    // initial load returns one item
    actionApi.getActionItems.mockResolvedValueOnce([item])
    // after update, refresh returns updated item
    actionApi.getActionItems.mockResolvedValueOnce([updatedItem])
    actionApi.updateActionItem.mockResolvedValue(updatedItem)

    render(
      <AuthContext.Provider value={{ user: { id: 'u1' }, isAuthenticated: true, isLoading: false, login: async () => {}, logout: async () => {} } as any}>
        <MemoryRouter initialEntries={["/meetings/m1"]}>
          <Routes>
            <Route path="/meetings/:id" element={<MeetingDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    // wait for select to appear
    const select = await screen.findByLabelText(`status-select-${item.id}`)
    const user = userEvent.setup()

    await user.selectOptions(select as HTMLSelectElement, 'Done')

    await waitFor(() => {
      expect(actionApi.updateActionItem).toHaveBeenCalledWith('ai1', { status: 'Done' })
    })

    // after refresh, select value should reflect updated status
    await waitFor(() => {
      expect((screen.getByLabelText(`status-select-${item.id}`) as HTMLSelectElement).value).toBe('Done')
    })
  })

  it('modal save triggers action items refresh', async () => {
    const mockMeeting = {
      id: 'm1',
      title: 'Team Sync',
      date: '2024-01-01T12:00:00Z',
      attendees: ['Alice'],
      notes: 'Notes',
    }

    api.getMeeting.mockResolvedValue(mockMeeting)

    // initial action items empty
    actionApi.getActionItems.mockResolvedValueOnce([])
    // after save, backend returns a saved item
    const saved = [
      {
        id: 'ai-saved',
        meetingId: 'm1',
        description: 'Saved task',
        status: 'To Do',
      },
    ]
    actionApi.getActionItems.mockResolvedValueOnce(saved)

    // createActionItems is called by modal (meetings api)
    api.analyzeMeeting.mockResolvedValue({ summary: '', keyDiscussionPoints: [], decisions: [], suggestedActionItems: [] })
    api.createActionItems.mockResolvedValue(undefined)

    render(
      <AuthContext.Provider value={{ user: { id: 'u1' }, isAuthenticated: true, isLoading: false, login: async () => {}, logout: async () => {} } as any}>
        <MemoryRouter initialEntries={["/meetings/m1"]}>
          <Routes>
            <Route path="/meetings/:id" element={<MeetingDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    const reviewBtn = await screen.findByRole('button', { name: /review action items/i })
    await userEvent.click(reviewBtn)

    // modal mounts; click Save in modal. The modal's Save triggers meetings.createActionItems
    const saveBtn = await screen.findByRole('button', { name: /Save/i })
    await userEvent.click(saveBtn)

    // ensure createActionItems called
    await waitFor(() => {
      expect(api.createActionItems).toHaveBeenCalled()
    })

    // ensure getActionItems called again to refresh
    await waitFor(() => {
      expect(actionApi.getActionItems).toHaveBeenCalled()
    })

    // After refresh, the saved item should be rendered
    await waitFor(() => {
      expect(screen.getByText('Saved task')).toBeInTheDocument()
    })
  })
})
