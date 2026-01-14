import { vi, describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'

// Provide a lightweight mock for react-router-dom used by ProtectedRoute
vi.mock('react-router-dom', () => ({
  Outlet: () => React.createElement('div', { 'data-testid': 'outlet' }, 'OUTLET'),
  Navigate: ({ to }: any) => React.createElement('div', { 'data-testid': 'navigate' }, `NAVIGATE:${to}`),
  useLocation: () => ({ pathname: '/protected' }),
}))

import ProtectedRoute from './ProtectedRoute'
import { AuthContext } from '../contexts/AuthContext'

function renderWithAuth(value: any) {
  return render(
    <AuthContext.Provider value={value}>
      <ProtectedRoute />
    </AuthContext.Provider>,
  )
}

describe('ProtectedRoute', () => {
  it('renders outlet when authenticated', () => {
    renderWithAuth({ user: { id: '1' }, isAuthenticated: true, isLoading: false, login: async () => {}, logout: async () => {} })
    expect(screen.queryByTestId('outlet')).toBeTruthy()
    expect(screen.queryByTestId('navigate')).toBeNull()
  })

  it('redirects to login when not authenticated', () => {
    renderWithAuth({ user: null, isAuthenticated: false, isLoading: false, login: async () => {}, logout: async () => {} })
    const nav = screen.getByTestId('navigate')
    expect(nav).toBeTruthy()
    expect(nav.textContent).toContain('login')
  })

  it('renders nothing when loading', () => {
    renderWithAuth({ user: null, isAuthenticated: false, isLoading: true, login: async () => {}, logout: async () => {} })
    expect(screen.queryByTestId('outlet')).toBeNull()
    expect(screen.queryByTestId('navigate')).toBeNull()
  })
})
