export type AuthUser = Record<string, unknown> | null

export type LoginCredentials = Record<string, unknown>

export interface AuthContextValue {
  user: AuthUser
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
}
