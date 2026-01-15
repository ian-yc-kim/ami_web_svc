import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getMeeting } from '../api/meetings'
import type { Meeting } from '../types/meeting'

export default function MeetingDetailPage() {
  const { id } = useParams()
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
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
        console.error('MeetingDetailPage:', err)
        if (!mounted) return
        setError('Meeting not found')
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

  if (isLoading) return <div role="status">Loading meeting...</div>

  if (error) return <div role="alert">{error}</div>

  if (!meeting) return <div role="alert">Meeting not found</div>

  return (
    <main>
      <h2>{meeting.title}</h2>
      <div>{meeting.date}</div>
      <h3>Attendees</h3>
      <ul>
        {meeting.attendees.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
      <h3>Notes</h3>
      <p>{meeting.notes}</p>
      <div>
        <Link to={`/meetings/${meeting.id}/edit`}>Edit</Link>
      </div>
    </main>
  )
}
