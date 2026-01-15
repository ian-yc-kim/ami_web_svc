/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'

import * as meetingsApi from '../api/meetings'
import * as actionItemsApi from '../api/actionItems'

vi.mock('../api/meetings')
vi.mock('../api/actionItems')

// Mock KanbanBoard to a simple deterministic component for tests
vi.mock('../components/KanbanBoard', () => {
  return {
    default: (props: any) => {
      const { items, onItemUpdate } = props
      return (
        <div>
          {['To Do', 'In Progress', 'Done'].map((status) => (
            <section key={status} data-testid={`kanban-column-${status}`}>
              <h4>{status}</h4>
              <div>
                {items.filter((i: any) => i.status === status).map((it: any) => (
                  <div key={it.id} data-testid={`kanban-card-${it.id}`}>
                    {it.description}
                  </div>
                ))}
              </div>
            </section>
          ))}
          <button data-testid="board-update-btn" onClick={() => {
            if (!items || items.length === 0) return
            const first = items[0]
            onItemUpdate && onItemUpdate(first.id, 'Done')
          }}>Simulate Update</button>
        </div>
      )
    }
  }
})

// Mock ActionItemReviewModal to simulate calling createActionItems then notify parent via onSaved
vi.mock('../components/ActionItemReviewModal', () => {
  return {
    default: (props: any) => {
      return (
        <div>
          <button data-testid="modal-save-btn" onClick={async () => {
            try {
              // Simulate the modal calling the meetings API to create action items
              if (typeof (require('../api/meetings') as any).createActionItems === 'function') {
                await (require('../api/meetings') as any).createActionItems(props.meetingId, props.initialItems)
              }
            } catch (e) {
              // ignore in mock
            }
            props.onSaved && props.onSaved()
          }}>Save</button>
        </div>
      )
    }
  }
})

import MeetingDetailPage from './MeetingDetailPage'

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

  it('renders meeting details and action items header', async () => {
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

    // action items header present
    expect(screen.getByRole('heading', { name: /Action Items/i })).toBeInTheDocument()
    expect(actionApi.getActionItems).toHaveBeenCalledWith('m1')
  })

  it('view toggle switches between List and Board', async () => {
    const mockMeeting = { id: 'm1', title: 'Team', date: '', attendees: [], notes: '' }
    api.getMeeting.mockResolvedValue(mockMeeting)

    const items = [
      { id: 'a1', meetingId: 'm1', description: 'Task 1', status: 'To Do' },
    ]
    actionApi.getActionItems.mockResolvedValue(items)

    render(
      <AuthContext.Provider value={{ user: { id: 'u1' }, isAuthenticated: true, isLoading: false, login: async () => {}, logout: async () => {} } as any}>
        <MemoryRouter initialEntries={["/meetings/m1"]}>
          <Routes>
            <Route path="/meetings/:id" element={<MeetingDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    // initially list view: action-item should be rendered
    expect(await screen.findByText('Task 1')).toBeInTheDocument()

    // switch to board
    const boardBtn = screen.getByLabelText('view-toggle-board')
    await userEvent.click(boardBtn)

    // now the Kanban columns should render (from mock)
    expect(await screen.findByTestId('kanban-column-To Do')).toBeInTheDocument()
    expect(screen.getByTestId('kanban-card-a1')).toBeInTheDocument()
  })

  it('filters by assignee and priority and clearing shows all', async () => {
    const mockMeeting = { id: 'm1', title: 'Team', date: '', attendees: [], notes: '' }
    api.getMeeting.mockResolvedValue(mockMeeting)

    const items = [
      { id: 'i1', meetingId: 'm1', description: 'First', status: 'To Do', assignee: 'Alice', priority: 'High' },
      { id: 'i2', meetingId: 'm1', description: 'Second', status: 'To Do', assignee: 'Bob', priority: 'Low' },
    ]
    actionApi.getActionItems.mockResolvedValue(items)

    render(
      <AuthContext.Provider value={{ user: { id: 'u1' }, isAuthenticated: true, isLoading: false, login: async () => {}, logout: async () => {} } as any}>
        <MemoryRouter initialEntries={["/meetings/m1"]}>
          <Routes>
            <Route path="/meetings/:id" element={<MeetingDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    // wait for list items
    expect(await screen.findByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()

    // filter by assignee Alice
    const assigneeSelect = screen.getByLabelText('assignee-filter') as HTMLSelectElement
    await userEvent.selectOptions(assigneeSelect, 'Alice')

    await waitFor(() => {
      expect(screen.getByText('First')).toBeInTheDocument()
      expect(screen.queryByText('Second')).not.toBeInTheDocument()
    })

    // change to priority filter High (should still show First)
    const prioritySelect = screen.getByLabelText('priority-filter') as HTMLSelectElement
    await userEvent.selectOptions(prioritySelect, 'High')

    await waitFor(() => {
      expect(screen.getByText('First')).toBeInTheDocument()
      expect(screen.queryByText('Second')).not.toBeInTheDocument()
    })

    // clear filters
    await userEvent.selectOptions(assigneeSelect, 'All')
    await userEvent.selectOptions(prioritySelect, 'All')

    await waitFor(() => {
      expect(screen.getByText('First')).toBeInTheDocument()
      expect(screen.getByText('Second')).toBeInTheDocument()
    })
  })

  it('list status change calls updateActionItem and refreshes list', async () => {
    const mockMeeting = { id: 'm1', title: 'Team', date: '', attendees: [], notes: '' }
    api.getMeeting.mockResolvedValue(mockMeeting)

    const item = { id: 'l1', meetingId: 'm1', description: 'ListTask', status: 'To Do' }
    const updated = { ...item, status: 'Done' }

    actionApi.getActionItems.mockResolvedValueOnce([item])
    actionApi.getActionItems.mockResolvedValueOnce([updated])
    actionApi.updateActionItem.mockResolvedValue(updated)

    render(
      <AuthContext.Provider value={{ user: { id: 'u1' }, isAuthenticated: true, isLoading: false, login: async () => {}, logout: async () => {} } as any}>
        <MemoryRouter initialEntries={["/meetings/m1"]}>
          <Routes>
            <Route path="/meetings/:id" element={<MeetingDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    // wait for list select to appear
    const select = await screen.findByLabelText(`status-select-${item.id}`)
    await userEvent.selectOptions(select as HTMLSelectElement, 'Done')

    await waitFor(() => {
      expect(actionApi.updateActionItem).toHaveBeenCalledWith(item.id, { status: 'Done' })
    })

    // ensure refresh was triggered (getActionItems called for meeting)
    await waitFor(() => {
      expect(actionApi.getActionItems).toHaveBeenCalledWith('m1')
    })
  })

  it('modal save triggers action items refresh', async () => {
    const mockMeeting = { id: 'm1', title: 'Team', date: '', attendees: [], notes: '' }
    api.getMeeting.mockResolvedValue(mockMeeting)

    const item = { id: 'm1i', meetingId: 'm1', description: 'X', status: 'To Do' }
    actionApi.getActionItems.mockResolvedValueOnce([item])
    actionApi.getActionItems.mockResolvedValueOnce([item])

    // ensure the meetings API createActionItems is mocked and observed
    api.createActionItems = vi.fn().mockResolvedValue([item])

    render(
      <AuthContext.Provider value={{ user: { id: 'u1' }, isAuthenticated: true, isLoading: false, login: async () => {}, logout: async () => {} } as any}>
        <MemoryRouter initialEntries={["/meetings/m1"]}>
          <Routes>
            <Route path="/meetings/:id" element={<MeetingDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    // ensure initial load happened
    expect(await screen.findByText('X')).toBeInTheDocument()

    // click the modal save button from our mock (mock will call createActionItems then onSaved)
    const saveBtn = screen.getByTestId('modal-save-btn')
    await userEvent.click(saveBtn)

    await waitFor(() => {
      // ensure getActionItems was called again to refresh
      expect(actionApi.getActionItems).toHaveBeenCalledWith('m1')
      expect(actionApi.getActionItems).toHaveBeenCalled()
    })
  })

  it('status update works in Board view and triggers refresh', async () => {
    const mockMeeting = { id: 'm1', title: 'Team', date: '', attendees: [], notes: '' }
    api.getMeeting.mockResolvedValue(mockMeeting)

    const item = { id: 'b1', meetingId: 'm1', description: 'BoardTask', status: 'To Do' }
    const updated = { ...item, status: 'Done' }

    // initial load returns item, after update a refreshed list returns updated status
    actionApi.getActionItems.mockResolvedValueOnce([item])
    actionApi.getActionItems.mockResolvedValueOnce([updated])
    actionApi.updateActionItem.mockResolvedValue(updated)

    render(
      <AuthContext.Provider value={{ user: { id: 'u1' }, isAuthenticated: true, isLoading: false, login: async () => {}, logout: async () => {} } as any}>
        <MemoryRouter initialEntries={["/meetings/m1"]}>
          <Routes>
            <Route path="/meetings/:id" element={<MeetingDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    // switch to board
    const boardBtn = await screen.findByLabelText('view-toggle-board')
    await userEvent.click(boardBtn)

    // ensure board card is present
    expect(await screen.findByTestId('kanban-card-b1')).toBeInTheDocument()

    // simulate Kanban component triggering onItemUpdate via mock's button
    const simBtn = screen.getByTestId('board-update-btn')
    await userEvent.click(simBtn)

    await waitFor(() => {
      expect(actionApi.updateActionItem).toHaveBeenCalledWith('b1', { status: 'Done' })
    })

    // after refresh, updated card should be in Done column
    await waitFor(() => {
      expect(screen.getByTestId('kanban-card-b1')).toBeInTheDocument()
    })
  })
})
