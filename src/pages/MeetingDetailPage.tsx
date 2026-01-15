import React, { useEffect, useState, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getMeeting, analyzeMeeting } from '../api/meetings'
import { getActionItems, updateActionItem } from '../api/actionItems'
import type { Meeting } from '../types/meeting'
import type { CreateActionItemDTO, ActionItem, ActionItemStatus, ActionItemPriority } from '../types/actionItem'
import ActionItemReviewModal from '../components/ActionItemReviewModal'
import ActionItemList from '../components/ActionItemList'
import KanbanBoard from '../components/KanbanBoard'

export default function MeetingDetailPage() {
  const { id } = useParams()
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false)
  const [extractedItems, setExtractedItems] = useState<CreateActionItemDTO[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)

  const [actionItems, setActionItems] = useState<ActionItem[]>([])

  // New UI state for view and filters
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('All')
  const [priorityFilter, setPriorityFilter] = useState<'All' | ActionItemPriority>('All')

  // single mounted ref pattern
  const isMountedRef = useRef(true)
  // request counters to avoid race conditions when id changes
  const meetingRequestRef = useRef(0)
  const actionItemsRequestRef = useRef(0)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchActionItems = async (meetingId: string): Promise<void> => {
    if (!meetingId) return
    // increment request id for action items
    actionItemsRequestRef.current += 1
    const req = actionItemsRequestRef.current

    try {
      const items = await getActionItems(meetingId)
      // if unmounted or a newer request started, ignore
      if (!isMountedRef.current) return
      if (req !== actionItemsRequestRef.current) return
      setActionItems(items)
    } catch (err) {
      console.error('MeetingDetailPage:', err)
    }
  }

  useEffect(() => {
    // ensure we use mounted-ref + request id to avoid stale updates
    if (!id) {
      setError('Meeting not found')
      setIsLoading(false)
      return
    }

    // increment meeting request id
    meetingRequestRef.current += 1
    const req = meetingRequestRef.current

    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getMeeting(id)
        if (!isMountedRef.current) return
        if (req !== meetingRequestRef.current) return
        if (cancelled) return
        setMeeting(data)
        // clear previous action items while fetching new ones
        setActionItems([])
        // fetch action items for the meeting (uses its own request id guard)
        void fetchActionItems(id)
      } catch (err) {
        console.error('MeetingDetailPage:', err)
        if (!isMountedRef.current) return
        if (req !== meetingRequestRef.current) return
        setError('Meeting not found')
      } finally {
        if (!isMountedRef.current) return
        if (req !== meetingRequestRef.current) return
        setIsLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [id])

  const handleReviewClick = async (): Promise<void> => {
    if (!meeting) return
    setIsAnalyzing(true)
    try {
      const analysis = await analyzeMeeting(meeting.id)
      const items = analysis?.suggestedActionItems ?? []
      // Open modal and set extracted items
      setIsReviewModalOpen(true)
      setExtractedItems(items)
    } catch (err: unknown) {
      console.error('MeetingDetailPage:', err)
      try {
        alert('Failed to analyze meeting')
      } catch (e) {
        console.error('MeetingDetailPage:', e)
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleStatusUpdate = async (actionItemId: string, status: ActionItemStatus): Promise<void> => {
    try {
      await updateActionItem(actionItemId, { status })
      // refresh list after update only if still mounted and meeting hasn't changed
      if (isMountedRef.current && meeting) {
        // increment action items request id implicitly inside fetchActionItems
        await fetchActionItems(meeting.id)
      }
    } catch (err) {
      console.error('MeetingDetailPage:', err)
    }
  }

  // derived filter options
  const assigneeOptions = React.useMemo(() => {
    const set = new Set<string>()
    for (const it of actionItems) {
      if (it.assignee && it.assignee.trim() !== '') set.add(it.assignee)
    }
    const arr = Array.from(set).sort()
    return ['All', ...arr]
  }, [actionItems])

  const priorityOptions: Array<'All' | ActionItemPriority> = ['All', 'Low', 'Medium', 'High']

  const filteredItems = React.useMemo(() => {
    return actionItems.filter((it) => {
      if (assigneeFilter !== 'All') {
        if (!it.assignee) return false
        if (it.assignee !== assigneeFilter) return false
      }
      if (priorityFilter !== 'All') {
        if (!it.priority) return false
        if (it.priority !== priorityFilter) return false
      }
      return true
    })
  }, [actionItems, assigneeFilter, priorityFilter])

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

      {/* Action items header with view toggle and filters */}
      <div style={{ marginTop: '1rem' }}>
        <section aria-label="Action items">
          <h3>Action Items</h3>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <div role="group" aria-label="view-toggle" style={{ display: 'flex', gap: 4 }}>
              <button aria-label="view-toggle-list" type="button" onClick={() => setViewMode('list')} disabled={viewMode === 'list'}>
                List
              </button>
              <button aria-label="view-toggle-board" type="button" onClick={() => setViewMode('board')} disabled={viewMode === 'board'}>
                Board
              </button>
            </div>

            <div>
              <label htmlFor="assignee-filter">Assignee</label>
              <select
                id="assignee-filter"
                aria-label="assignee-filter"
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
              >
                {assigneeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="priority-filter">Priority</label>
              <select
                id="priority-filter"
                aria-label="priority-filter"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as 'All' | ActionItemPriority)}
              >
                {priorityOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Render appropriate view */}
          <div>
            {viewMode === 'board' ? (
              <KanbanBoard items={filteredItems} onItemUpdate={handleStatusUpdate} />
            ) : (
              <ActionItemList items={filteredItems} onItemUpdate={handleStatusUpdate} />
            )}
          </div>
        </section>
      </div>

      <ActionItemReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        meetingId={meeting.id}
        initialItems={extractedItems}
        onSaved={() => {
          // refresh action items after modal saves
          if (isMountedRef.current && meeting) void fetchActionItems(meeting.id)
        }}
      />
    </main>
  )
}
