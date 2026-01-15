import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import Navbar from './Navbar'

describe('Navbar', () => {
  it('does not show logout or meetings link when unauthenticated', () => {
    const value = { user: null, isAuthenticated: false, isLoading: false, login: async () => {}, logout: async () => {} }
    render(
      <AuthContext.Provider value={value as any}>
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    expect(screen.queryByRole('button', { name: /logout/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /meetings/i })).toBeNull()
    expect(screen.getByText(/Meeting Web/i)).toBeInTheDocument()
  })

  it('shows logout and meetings link when authenticated and navigates on click', async () => {
    const logoutMock = vi.fn().mockResolvedValue(undefined)
    const value = { user: { id: 'u1' }, isAuthenticated: true, isLoading: false, login: async () => {}, logout: logoutMock }

    render(
      <AuthContext.Provider value={value as any}>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<Navbar />} />
            <Route path="/login" element={<div>Login Page</div>} />
            <Route path="/meetings" element={<div>Meetings Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    // Meetings link present
    const meetingsLink = screen.getByRole('link', { name: /meetings/i })
    expect(meetingsLink).toBeInTheDocument()

    // Click logout
    const btn = screen.getByRole('button', { name: /logout/i })
    await userEvent.click(btn)

    expect(logoutMock).toHaveBeenCalled()
    // after logout Navbar triggers navigate to /login so Login Page should be rendered
    expect(await screen.findByText(/Login Page/i)).toBeInTheDocument()
  })
})
