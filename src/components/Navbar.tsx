import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Navbar:', error)
    }
  }

  return (
    <nav className="app-navbar">
      <h1>Meeting Web</h1>
      {isAuthenticated && (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/meetings">Meetings</Link>
          <button type="button" onClick={handleLogout} aria-label="logout-button">
            Logout
          </button>
        </div>
      )}
    </nav>
  )
}
