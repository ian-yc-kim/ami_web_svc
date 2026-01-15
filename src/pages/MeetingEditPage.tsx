import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MeetingForm from '../components/MeetingForm'
import { getMeeting, updateMeeting } from '../api/meetings'
import type { Meeting, CreateMeetingDTO } from '../types/meeting'

export default function MeetingEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!id) {
        setError('Meeting not found')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const data = await getMeeting(id)
        if (!mounted) return
        setMeeting(data)
      } catch (err) {
        console.error('Component:', err)
        if (!mounted) return
        setError('Failed to load meeting')
      } finally {
        if (!mounted) return
        setIsLoading(false)
      }
    }

    void load()
    return () => {
      mounted = false
    }
  }, [id])

  const handleSubmit = async (data: CreateMeetingDTO) => {
    if (!id) return
    setIsSubmitting(true)
    try {
      await updateMeeting(id, data)
      navigate(`/meetings/${id}`)
    } catch (err) {
      console.error('Component:', err)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <div role="status">Loading meeting...</div>
  if (error) return <div role="alert">{error}</div>
  if (!meeting) return <div role="alert">Meeting not found</div>

  return (
    <main>
      <h2>Edit Meeting</h2>
      <MeetingForm initialData={meeting} onSubmit={handleSubmit} isLoading={isSubmitting} />
    </main>
  )
}
