import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardPage from './DashboardPage'

vi.mock('../api/dashboard', () => ({
  getDashboardMetrics: vi.fn(),
}))

import * as dashboardApi from '../api/dashboard'
import type { DashboardMetrics } from '../types/dashboard'

describe('DashboardPage', () => {
  const api = dashboardApi as unknown as { getDashboardMetrics: Mock }
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.resetAllMocks()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('shows loading state while fetching', async () => {
    let resolve!: (v?: unknown) => void
    const p = new Promise((res) => {
      resolve = res
    })
    api.getDashboardMetrics.mockReturnValue(p as unknown)

    render(<DashboardPage />)

    // Mandated UI: Loading text without role attribute
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // resolve to avoid unresolved promise warnings
    resolve({
      summary: { totalActionItems: 0, completionRate: 0, overdueCount: 0 },
      overdueItems: [],
      teamStats: [],
    } as DashboardMetrics)
  })

  it('renders metrics, overdue list and team stats on success', async () => {
    const payload: DashboardMetrics = {
      summary: { totalActionItems: 10, completionRate: 75, overdueCount: 1 },
      overdueItems: [
        {
          id: 'o1',
          description: 'Fix bug',
          assignee: 'Alice',
          dueDate: new Date().toISOString(),
          meetingTitle: 'Sprint Planning',
        },
      ],
      teamStats: [
        { assignee: 'Alice', total: 5, completed: 4, overdue: 1 },
      ],
    }

    api.getDashboardMetrics.mockResolvedValue(payload)

    render(<DashboardPage />)

    expect(await screen.findByRole('heading', { level: 2 })).toHaveTextContent('Team Dashboard')

    const totalRegion = screen.getByRole('region', { name: 'Total Action Items' })
    expect(totalRegion).toHaveTextContent('10')

    const rateRegion = screen.getByRole('region', { name: 'Completion Rate' })
    expect(rateRegion).toHaveTextContent(/75%/)

    const overdueRegion = screen.getByRole('region', { name: 'Overdue Items' })
    expect(overdueRegion).toHaveTextContent('1')

    expect(await screen.findByTestId('overdue-row-o1')).toBeInTheDocument()
    expect(screen.getByTestId('teamstat-row-Alice')).toBeInTheDocument()
  })

  it('shows error when API fails', async () => {
    api.getDashboardMetrics.mockRejectedValue(new Error('boom'))

    render(<DashboardPage />)

    // Mandated UI: error displayed as plain text without role alert
    const alert = await screen.findByText('Failed to load dashboard metrics.')
    expect(alert).toBeInTheDocument()
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    expect(console.error).toHaveBeenCalled()
  })
})
