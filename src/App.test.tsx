import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { AuthContext } from './contexts/AuthContext'

describe('App routing', () => {
  it('shows dashboard when authenticated', async () => {
    render(
      <AuthContext.Provider value={{ user: { id: 'u1' }, isAuthenticated: true, isLoading: false, login: async () => {}, logout: async () => {} } as any}>
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    // Dashboard header should be present when authenticated
    expect(await screen.findByRole('heading', { level: 2 })).toHaveTextContent(/dashboard/i)
  })

  it('does not show dashboard when unauthenticated (redirects)', async () => {
    render(
      <AuthContext.Provider value={{ user: null, isAuthenticated: false, isLoading: false, login: async () => {}, logout: async () => {} } as any}>
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    // Dashboard heading should not be present for unauthenticated users
    const heading = screen.queryByRole('heading', { level: 2, name: /dashboard/i })
    expect(heading).toBeNull()
  })
})
