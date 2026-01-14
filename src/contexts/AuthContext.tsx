import React, { createContext, useContext, useEffect, useState } from 'react'
import apiClient from '../api/client'
import type { AuthUser, LoginCredentials, AuthContextValue } from '../types/auth'

const STORAGE_KEY = 'auth_user'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as AuthUser
          setUser(parsed)
        } catch (e) {
          console.error('AuthContext: failed to parse stored user', e)
          localStorage.removeItem(STORAGE_KEY)
          setUser(null)
        }
      }
    } catch (e) {
      console.error('AuthContext:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials)
      const data: unknown = response?.data
      let userPayload: AuthUser = null

      if (isRecord(data)) {
        const datum = data as Record<string, unknown>
        if ('user' in datum && isRecord(datum.user)) {
          userPayload = datum.user as Record<string, unknown>
        } else {
          userPayload = datum
        }
      }

      setUser(userPayload)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userPayload))
      } catch (e) {
        console.error('AuthContext: failed to persist user', e)
      }
    } catch (error) {
      console.error('AuthContext:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      // ignore backend errors but log for debugging
      console.error('AuthContext: logout error', error)
    } finally {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch (e) {
        console.error('AuthContext: failed to clear storage', e)
      }
      setUser(null)
    }
  }

  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

export { AuthContext }
