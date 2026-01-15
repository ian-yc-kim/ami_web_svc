import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getMeeting, analyzeMeeting } from '../api/meetings'
import type { Meeting } from '../types/meeting'
import type { CreateActionItemDTO } from '../types/actionItem'
import ActionItemReviewModal from '../components/ActionItemReviewModal'

export default function MeetingDetailPage() {
  const { id } = useParams()
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false)
  const [extractedItems, setExtractedItems] = useState<CreateActionItemDTO[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)

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

  const handleReviewClick = async (): Promise<void> => {
    if (!meeting) return
    setIsAnalyzing(true)
    try {
      const analysis = await analyzeMeeting(meeting.id)
      const items = analysis?.suggestedActionItems ?? []
      // Open modal first then update extracted items so modal will mount
      // and then receive the items via prop update (useEffect inside modal handles this)
      setIsReviewModalOpen(true)
      setExtractedItems(items)
    } catch (err: unknown) {
      console.error('MeetingDetailPage:', err)
      try {
        alert('Failed to analyze meeting')
      } catch (e) {
        // alert might not exist in some test environments
        console.error('MeetingDetailPage:', e)
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

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

      <div style={{ marginTop: '1rem' }}>
        <button type="button" onClick={handleReviewClick} disabled={isAnalyzing}>
          {isAnalyzing ? 'Analyzing...' : 'Review Action Items'}
        </button>
      </div>

      <ActionItemReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        meetingId={meeting.id}
        initialItems={extractedItems}
      />
    </main>
  )
}
