import React, { useEffect, useState } from 'react'
import type { Meeting, CreateMeetingDTO } from '../types/meeting'

export interface MeetingFormProps {
  initialData?: Meeting
  onSubmit: (data: CreateMeetingDTO) => Promise<void> | void
  isLoading?: boolean
}

function isoToDatetimeLocal(iso?: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const tzOffset = d.getTimezoneOffset()
    const local = new Date(d.getTime() - tzOffset * 60000)
    return local.toISOString().slice(0, 16)
  } catch (error) {
    console.error('Component:', error)
    return ''
  }
}

export default function MeetingForm(props: MeetingFormProps) {
  const { initialData, onSubmit, isLoading = false } = props
  const [title, setTitle] = useState<string>(initialData?.title || '')
  const [dateInput, setDateInput] = useState<string>(isoToDatetimeLocal(initialData?.date))
  const [attendeesText, setAttendeesText] = useState<string>((initialData?.attendees || []).join(', '))
  const [notes, setNotes] = useState<string>(initialData?.notes || '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    setTitle(initialData?.title || '')
    setDateInput(isoToDatetimeLocal(initialData?.date))
    setAttendeesText((initialData?.attendees || []).join(', '))
    setNotes(initialData?.notes || '')
  }, [initialData])

  const validate = (): boolean => {
    const next: Record<string, string> = {}

    if (!title.trim()) next.title = 'Title is required'
    if (!dateInput.trim()) next.date = 'Date is required'

    const attendees = attendeesText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    if (attendees.length === 0) next.attendees = 'At least one attendee is required'
    if (!notes || notes.trim().length === 0) next.notes = 'Notes are required'
    else if (notes.trim().length < 50) next.notes = 'Notes must be at least 50 characters'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    try {
      if (!validate()) return

      const attendees = attendeesText
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)

      // Convert datetime-local to ISO
      const dateIso = (() => {
        try {
          const d = new Date(dateInput)
          return d.toISOString()
        } catch (err) {
          console.error('Component:', err)
          return new Date().toISOString()
        }
      })()

      const payload: CreateMeetingDTO = {
        title: title.trim(),
        date: dateIso,
        attendees,
        notes: notes.trim(),
      }

      await onSubmit(payload)
    } catch (error) {
      console.error('Component:', error)
      setFormError('Failed to submit form')
    }
  }

  const notesError = errors.notes
  const disabled = isLoading

  return (
    <form onSubmit={handleSubmit} aria-label="meeting-form">
      <div>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        {errors.title && <div role="alert">{errors.title}</div>}
      </div>

      <div>
        <label htmlFor="date">Date</label>
        <input
          id="date"
          name="date"
          type="datetime-local"
          value={dateInput}
          onChange={(e) => setDateInput(e.target.value)}
          required
        />
        {errors.date && <div role="alert">{errors.date}</div>}
      </div>

      <div>
        <label htmlFor="attendees">Attendees (comma separated)</label>
        <input
          id="attendees"
          name="attendees"
          value={attendeesText}
          onChange={(e) => setAttendeesText(e.target.value)}
          required
        />
        {errors.attendees && <div role="alert">{errors.attendees}</div>}
      </div>

      <div>
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          required
        />
        {notesError && <div role="alert">{notesError}</div>}
      </div>

      {formError && <div role="alert">{formError}</div>}

      <div>
        <button type="submit" disabled={disabled}>
          {isLoading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}
