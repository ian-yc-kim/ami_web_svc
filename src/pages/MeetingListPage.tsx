import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMeetings } from '../api/meetings'
import type { Meeting } from '../types/meeting'

export function sortMeetingsByDateDesc(meetings: Meeting[]): Meeting[] {
  return [...meetings].sort((a, b) => {
    const da = Date.parse(a.date) || 0
    const db = Date.parse(b.date) || 0
    return db - da
  })
}

export function formatAttendeesSummary(attendees: string[]): string {
  if (!attendees || attendees.length === 0) return 'No attendees'
  if (attendees.length <= 3) return attendees.join(', ')
  const firstTwo = attendees.slice(0, 2).join(', ')
  return `${firstTwo} (+${attendees.length - 2})`
}

export default function MeetingListPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setIsLoading(true)
      try {
        const data = await getMeetings()
        if (!mounted) return
        const sorted = sortMeetingsByDateDesc(data)
        setMeetings(sorted)
      } catch (err) {
        console.error('MeetingListPage:', err)
        if (!mounted) return
        setError('Failed to load meetings')
      } finally {
        if (!mounted) return
        setIsLoading(false)
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <main>
      <h2>Meetings</h2>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/meetings/new">New Meeting</Link>
      </div>

      {isLoading && <div role="status">Loading meetings...</div>}
      {error && !isLoading && (
        <div role="alert">{error}</div>
      )}

      {!isLoading && !error && (
        <ul>
          {meetings.map((m) => (
            <li key={m.id} data-testid="meeting-item">
              <h3>{m.title}</h3>
              <div>{m.date}</div>
              <div>{formatAttendeesSummary(m.attendees)}</div>
              <div>
                <Link to={`/meetings/${m.id}`}>View</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
