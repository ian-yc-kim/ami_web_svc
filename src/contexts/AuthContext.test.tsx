import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useEffect } from 'react'
import { render, waitFor } from '@testing-library/react'

// mock api client before importing provider
vi.mock('../api/client', () => ({ default: { post: vi.fn() } }))

import apiClient from '../api/client'
import { AuthProvider, useAuth } from './AuthContext'

function Consumer({ onReady }: { onReady: (ctx: any) => void }) {
  const ctx = useAuth()
  // update caller whenever context changes so tests observe latest state
  useEffect(() => {
    onReady(ctx)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx])
  return null
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    localStorage.clear()
  })

  it('initializes from localStorage and sets loading false', async () => {
    const stored = { id: 'u1', name: 'Stored' }
    localStorage.setItem('auth_user', JSON.stringify(stored))

    let ctx: any
    render(
      <AuthProvider>
        <Consumer onReady={(c) => (ctx = c)} />
      </AuthProvider>,
    )

    await waitFor(() => expect(ctx).toBeDefined())
    await waitFor(() => expect(ctx.isLoading).toBe(false))

    expect(ctx.isAuthenticated).toBe(true)
    expect(ctx.user).toEqual(stored)
  })

  it('successful login sets user and persists', async () => {
    const response = { data: { user: { id: 'u2', name: 'Test' } } }
    // @ts-ignore
    apiClient.post.mockResolvedValue(response)

    let ctx: any
    render(
      <AuthProvider>
        <Consumer onReady={(c) => (ctx = c)} />
      </AuthProvider>,
    )

    await waitFor(() => expect(ctx).toBeDefined())

    await ctx.login({ username: 'x', password: 'y' })

    await waitFor(() => expect(ctx.isAuthenticated).toBe(true))

    expect(ctx.user).toEqual(response.data.user)
    expect(localStorage.getItem('auth_user')).toEqual(JSON.stringify(response.data.user))
  })

  it('failed login does not authenticate and rethrows', async () => {
    const error = new Error('bad creds')
    // @ts-ignore
    apiClient.post.mockRejectedValue(error)

    let ctx: any
    render(
      <AuthProvider>
        <Consumer onReady={(c) => (ctx = c)} />
      </AuthProvider>,
    )

    await waitFor(() => expect(ctx).toBeDefined())

    await expect(ctx.login({})).rejects.toBe(error)
    expect(ctx.isAuthenticated).toBe(false)
    expect(ctx.user).toBeNull()
  })

  it('logout clears user and localStorage even if API fails', async () => {
    const stored = { id: 'u3', name: 'WillLogout' }
    localStorage.setItem('auth_user', JSON.stringify(stored))

    // make logout API fail
    // @ts-ignore
    apiClient.post.mockRejectedValueOnce(new Error('network'))

    let ctx: any
    render(
      <AuthProvider>
        <Consumer onReady={(c) => (ctx = c)} />
      </AuthProvider>,
    )

    await waitFor(() => expect(ctx).toBeDefined())
    await waitFor(() => expect(ctx.isAuthenticated).toBe(true))

    await ctx.logout()

    await waitFor(() => expect(ctx.isAuthenticated).toBe(false))

    expect(ctx.user).toBeNull()
    expect(localStorage.getItem('auth_user')).toBeNull()
  })
})
