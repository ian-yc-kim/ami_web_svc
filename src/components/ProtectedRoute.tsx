import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return null

  const base = import.meta.env.BASE_URL ?? '/'
  const loginPath = base.endsWith('/') ? `${base}login` : `${base}/login`

  if (isAuthenticated) {
    return <Outlet />
  }

  return <Navigate to={loginPath} replace state={{ from: location }} />
}
