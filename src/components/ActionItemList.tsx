import React, { useState } from 'react'
import type { ActionItem, ActionItemStatus } from '../types/actionItem'

interface ActionItemListProps {
  items: ActionItem[]
  onItemUpdate: (id: string, status: ActionItemStatus) => Promise<void>
}

function formatDueDate(iso?: string): string | null {
  if (!iso) return null
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).format(d)
  } catch (error) {
    console.error('Component:', error)
    return iso
  }
}

function isActionItemStatus(value: string): value is ActionItemStatus {
  return value === 'To Do' || value === 'In Progress' || value === 'Done'
}

export default function ActionItemList(props: ActionItemListProps) {
  const { items, onItemUpdate } = props
  const [pendingById, setPendingById] = useState<Record<string, boolean>>({})

  const handleChange = (id: string) => async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value
    if (!isActionItemStatus(next)) return
    setPendingById((prev) => ({ ...prev, [id]: true }))
    try {
      await onItemUpdate(id, next)
    } catch (error) {
      console.error('Component:', error)
    } finally {
      setPendingById((prev) => ({ ...prev, [id]: false }))
    }
  }

  const isOverdue = (it: ActionItem): boolean => {
    if (!it.dueDate) return false
    if (it.status === 'Done') return false
    try {
      const d = new Date(it.dueDate)
      if (Number.isNaN(d.getTime())) return false
      return d.getTime() < Date.now()
    } catch (error) {
      console.error('Component:', error)
      return false
    }
  }

  return (
    <>
      {items.length === 0 ? (
        <div>No action items.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {items.map((it) => {
            const overdue = isOverdue(it)
            return (
              <li
                key={it.id}
                data-testid="action-item"
                {...(overdue ? { 'data-overdue': 'true' } : {})}
                style={overdue ? { border: '1px solid #c62828', padding: '0.5rem', marginBottom: '0.5rem', borderRadius: 4 } : { marginBottom: '0.5rem' }}
              >
                <div>
                  <strong>{it.description}</strong>
                </div>

                {it.assignee && (
                  <div>
                    <span>Assignee: </span>
                    <span>{it.assignee}</span>
                  </div>
                )}

                {it.dueDate && (
                  <div>
                    <span>Due: </span>
                    <span>{formatDueDate(it.dueDate) ?? it.dueDate}</span>
                  </div>
                )}

                <div style={{ marginTop: '0.5rem' }}>
                  <label htmlFor={`status-${it.id}`} style={{ marginRight: 8 }}>
                    Status
                  </label>
                  <select
                    id={`status-${it.id}`}
                    value={it.status}
                    onChange={handleChange(it.id)}
                    disabled={!!pendingById[it.id]}
                    aria-label={`status-select-${it.id}`}
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
