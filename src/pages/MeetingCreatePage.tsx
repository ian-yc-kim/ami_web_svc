import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MeetingForm from '../components/MeetingForm'
import { createMeeting } from '../api/meetings'
import type { CreateMeetingDTO } from '../types/meeting'

export default function MeetingCreatePage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const handleSubmit = async (data: CreateMeetingDTO) => {
    setIsLoading(true)
    try {
      await createMeeting(data)
      navigate('/meetings')
    } catch (error) {
      console.error('Component:', error)
      // Could show UI error; for now rely on MeetingForm to show generic error
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main>
      <h2>Create Meeting</h2>
      <MeetingForm onSubmit={handleSubmit} isLoading={isLoading} />
    </main>
  )
}
