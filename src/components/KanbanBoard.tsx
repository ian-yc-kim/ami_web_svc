import React from 'react'
import type { ActionItem, ActionItemStatus, ActionItemPriority } from '../types/actionItem'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'

interface KanbanBoardProps {
  items: ActionItem[]
  onItemUpdate: (id: string, status: ActionItemStatus) => Promise<void>
}

const STATUSES: ActionItemStatus[] = ['To Do', 'In Progress', 'Done']

const BADGE_COLORS: Record<ActionItemPriority, string> = {
  High: '#c62828',
  Medium: '#f9a825',
  Low: '#2e7d32',
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

function isOverdue(item: ActionItem): boolean {
  if (!item.dueDate) return false
  if (item.status === 'Done') return false
  try {
    const d = new Date(item.dueDate)
    if (Number.isNaN(d.getTime())) return false
    return d.getTime() < Date.now()
  } catch (error) {
    console.error('Component:', error)
    return false
  }
}

export default function KanbanBoard(props: KanbanBoardProps) {
  const { items, onItemUpdate } = props

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )

  const itemsByStatus = React.useMemo(() => {
    const map: Record<ActionItemStatus, ActionItem[]> = {
      'To Do': [],
      'In Progress': [],
      'Done': [],
    }
    for (const it of items) {
      if (it.status in map) map[it.status].push(it)
      else map['To Do'].push(it)
    }
    return map
  }, [items])

  const handleDragEnd = async (event: DragEndEvent) => {
    try {
      const over = event.over
      const active = event.active
      if (!over || !active) return
      const targetStatus = String(over.id) as ActionItemStatus
      const activeId = String(active.id)
      const dragged = items.find((i) => i.id === activeId)
      if (!dragged) return
      if (dragged.status === targetStatus) return
      await onItemUpdate(activeId, targetStatus)
    } catch (error) {
      console.error('Component:', error)
    }
  }

  return (
    <div>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', gap: 16 }}>
          {STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              items={itemsByStatus[status] ?? []}
            />
          ))}
        </div>
      </DndContext>
    </div>
  )
}

type DroppableReturn = {
  setNodeRef: (el: HTMLElement | null) => void
  isOver?: boolean
}

function Column({ status, items }: { status: ActionItemStatus; items: ActionItem[] }) {
  // useDroppable returns an object with setNodeRef
  const droppable = useDroppable({ id: status }) as unknown as DroppableReturn

  return (
    <section
      ref={droppable.setNodeRef}
      aria-label={`Column ${status}`}
      data-testid={`kanban-column-${status}`}
      style={{ flex: 1, minHeight: 200, padding: 8, border: '1px solid #eee', borderRadius: 6 }}
    >
      <h4>{status}</h4>
      <div>
        {items.map((it) => (
          <KanbanCard key={it.id} item={it} />
        ))}
      </div>
    </section>
  )
}

type DraggableReturn = {
  attributes?: Record<string, unknown>
  listeners?: Record<string, unknown>
  setNodeRef: (el: HTMLElement | null) => void
  isDragging?: boolean
}

function KanbanCard({ item }: { item: ActionItem }) {
  const draggable = useDraggable({ id: item.id }) as unknown as DraggableReturn

  const overdue = isOverdue(item)

  const dragAttributes = (draggable.attributes ?? {}) as Record<string, unknown>
  const dragListeners = (draggable.listeners ?? {}) as Record<string, unknown>

  const badgeColor = item.priority ? BADGE_COLORS[item.priority] ?? '#666' : undefined

  return (
    <article
      ref={draggable.setNodeRef}
      {...dragAttributes}
      {...dragListeners}
      data-testid={`kanban-card-${item.id}`}
      style={{
        border: overdue ? '1px solid #c62828' : '1px solid #ddd',
        padding: 8,
        marginBottom: 8,
        borderRadius: 4,
        background: '#fff',
      }}
      {...(overdue ? { 'data-overdue': 'true' } : {})}
      tabIndex={0}
      aria-label={`Card ${item.description}`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>{item.description}</strong>
        {item.priority && (
          <span
            data-testid={`priority-badge-${item.id}`}
            style={{
              padding: '2px 6px',
              borderRadius: 12,
              background: badgeColor,
              color: '#fff',
              fontSize: 12,
            }}
          >
            {item.priority}
          </span>
        )}
      </div>

      {item.assignee && (
        <div>
          <small>Assignee: {item.assignee}</small>
        </div>
      )}
      {item.dueDate && (
        <div>
          <small>Due: {formatDueDate(item.dueDate) ?? item.dueDate}</small>
        </div>
      )}
    </article>
  )
}
