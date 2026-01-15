import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import LoginPage from './LoginPage'

describe('LoginPage', () => {
  it('successful login calls login and navigates to dashboard', async () => {
    const loginMock = vi.fn().mockResolvedValue(undefined)
    const value = { user: null, isAuthenticated: false, isLoading: false, login: loginMock, logout: async () => {} }

    render(
      <AuthContext.Provider value={value as any}>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<div>Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    await userEvent.type(screen.getByLabelText('email-input'), 'a@b.com')
    await userEvent.type(screen.getByLabelText('password-input'), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => expect(loginMock).toHaveBeenCalled())
    expect(await screen.findByText(/Dashboard/i)).toBeInTheDocument()
  })

  it('failed login shows error message', async () => {
    const error = new Error('bad creds')
    const loginMock = vi.fn().mockRejectedValue(error)
    const value = { user: null, isAuthenticated: false, isLoading: false, login: loginMock, logout: async () => {} }

    render(
      <AuthContext.Provider value={value as any}>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    await userEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => expect(loginMock).toHaveBeenCalled())
    expect(await screen.findByRole('alert')).toHaveTextContent(/Invalid credentials/i)
  })
})
