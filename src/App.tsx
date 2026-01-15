import './styles/App.css'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProtectedRoute from './components/ProtectedRoute'
import MeetingListPage from './pages/MeetingListPage'
import MeetingDetailPage from './pages/MeetingDetailPage'
import MeetingCreatePage from './pages/MeetingCreatePage'
import MeetingEditPage from './pages/MeetingEditPage'

function App() {
  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/meetings" element={<MeetingListPage />} />
          <Route path="/meetings/new" element={<MeetingCreatePage />} />
          <Route path="/meetings/:id" element={<MeetingDetailPage />} />
          <Route path="/meetings/:id/edit" element={<MeetingEditPage />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
