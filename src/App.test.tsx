import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from './contexts/AuthContext'
import App from './App'

describe('App routing', () => {
  it('redirects to login when accessing protected route unauthenticated', () => {
    const value = { user: null, isAuthenticated: false, isLoading: false, login: async () => {}, logout: async () => {} }

    render(
      <AuthContext.Provider value={value as any}>
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    // Expect Login heading to be present because protected route should redirect
    expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument()
  })

  it('shows dashboard when authenticated', () => {
    const value = { user: { id: 'u1' }, isAuthenticated: true, isLoading: false, login: async () => {}, logout: async () => {} }

    render(
      <AuthContext.Provider value={value as any}>
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    expect(screen.getByText(/Welcome to Dashboard/i)).toBeInTheDocument()
  })
})
