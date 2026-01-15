import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'

// Mock dashboard API to avoid network calls during App rendering
vi.mock('./api/dashboard', () => ({
  getDashboardMetrics: vi.fn(),
}))

import * as dashboardApi from './api/dashboard'

describe('App routing', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Provide a safe resolved payload for dashboard metrics
    const payload = {
      summary: { totalActionItems: 0, completionRate: 0, overdueCount: 0 },
      overdueItems: [],
      teamStats: [],
    }
    ;(dashboardApi as unknown as { getDashboardMetrics: { mockResolvedValue: (v: unknown) => void } }).getDashboardMetrics.mockResolvedValue(payload)

    // Ensure AuthProvider treats user as authenticated via localStorage
    localStorage.setItem('auth_user', JSON.stringify({ id: 'test', name: 'Test User' }))
  })

  it('shows dashboard when authenticated', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    )

    const heading = await screen.findByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Team Dashboard')
  })

  it('does not show Team Dashboard when unauthenticated (redirects)', async () => {
    // simulate unauthenticated state
    localStorage.removeItem('auth_user')

    render(
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    )

    // specifically assert the Team Dashboard heading is not present
    expect(screen.queryByRole('heading', { level: 2, name: /Team Dashboard/ })).not.toBeInTheDocument()
  })
})
