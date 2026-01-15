import { useEffect, useState } from 'react'
import type { CreateActionItemDTO } from '../types/actionItem'
import { createActionItems } from '../api/meetings'

export interface ActionItemReviewModalProps {
  isOpen: boolean
  onClose: () => void
  meetingId: string
  initialItems: CreateActionItemDTO[]
  onSaved?: () => void
}

function isoToDateInput(iso?: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toISOString().slice(0, 10)
  } catch (error) {
    console.error('Component:', error)
    return ''
  }
}

function dateInputToIso(dateStr?: string): string | undefined {
  if (!dateStr) return undefined
  try {
    // Create a Date from YYYY-MM-DD which yields midnight UTC in modern engines
    const d = new Date(dateStr)
    return d.toISOString()
  } catch (error) {
    console.error('Component:', error)
    return undefined
  }
}

export default function ActionItemReviewModal(props: ActionItemReviewModalProps) {
  const { isOpen, onClose, meetingId, initialItems, onSaved } = props
  const [items, setItems] = useState<CreateActionItemDTO[]>(initialItems || [])
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setItems(initialItems || [])
      setError(null)
    }
  }, [isOpen, initialItems])

  const updateItem = (index: number, next: Partial<CreateActionItemDTO>) => {
    setItems((prev) => {
      const copy = prev.map((p) => ({ ...p }))
      copy[index] = { ...copy[index], ...next }
      return copy
    })
  }

  const addItem = () => {
    setItems((prev) => [...prev, { description: '', assignee: undefined, dueDate: undefined }])
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    try {
      await createActionItems(meetingId, items)
      try {
        onSaved?.()
      } catch (e) {
        // swallow onSaved errors but log
        console.error('Component:', e)
      }
      onClose()
    } catch (err: unknown) {
      console.error('Component:', err)
      setError((err as Error)?.message || 'Failed to save action items')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" data-testid="action-item-modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-label="Review Action Items"
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <h2>Review Action Items</h2>
          <button aria-label="close" onClick={onClose} disabled={isSaving}>
            ×
          </button>
        </header>

        <div>
          {items.length === 0 && <div>No action items. Add one to continue.</div>}

          <ul style={{ listStyle: 'none', padding: 0 }}>
            {items.map((it, idx) => (
              <li key={idx} className="action-item-row">
                <div>
                  <label htmlFor={`desc-${idx}`}>Description</label>
                  <input
                    id={`desc-${idx}`}
                    value={it.description}
                    onChange={(e) => updateItem(idx, { description: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor={`assignee-${idx}`}>Assignee</label>
                  <input
                    id={`assignee-${idx}`}
                    value={it.assignee ?? ''}
                    onChange={(e) => updateItem(idx, { assignee: e.target.value || undefined })}
                  />
                </div>

                <div>
                  <label htmlFor={`due-${idx}`}>Due date</label>
                  <input
                    id={`due-${idx}`}
                    type="date"
                    value={isoToDateInput(it.dueDate)}
                    onChange={(e) => updateItem(idx, { dueDate: dateInputToIso(e.target.value) })}
                  />
                </div>

                <div>
                  <button type="button" onClick={() => removeItem(idx)} disabled={isSaving}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div>
            <button type="button" onClick={addItem} disabled={isSaving}>
              Add item
            </button>
          </div>

          {error && <div role="alert" style={{ color: 'var(--danger, #b00020)' }}>{error}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
