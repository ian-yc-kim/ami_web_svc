/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Capture handler to allow tests to invoke onDragEnd
let capturedOnDragEnd: ((event: any) => void) | null = null

// Mock @dnd-kit/core before importing the component so the mock is applied
vi.mock('@dnd-kit/core', async () => {
  const React = await import('react')

  function DndContext({ children, onDragEnd }: any) {
    // capture latest onDragEnd
    capturedOnDragEnd = onDragEnd
    return React.createElement('div', { 'data-testid': 'mock-dnd' }, children)
  }

  function PointerSensor() { return null }
  function KeyboardSensor() { return null }
  function useSensor() { return null }
  function useSensors() { return null }

  function useDraggable(_opts: any) {
    return {
      attributes: {},
      listeners: {},
      setNodeRef: () => null,
      isDragging: false,
    }
  }

  function useDroppable(_opts: any) {
    return {
      setNodeRef: () => null,
      isOver: false,
    }
  }

  return {
    DndContext,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    useDraggable,
    useDroppable,
    __esModule: true,
  }
})

import { render, screen, within } from '@testing-library/react'
import KanbanBoard from './KanbanBoard'
import type { ActionItem, ActionItemStatus } from '../types/actionItem'

function makeItem(overrides?: Partial<ActionItem>): ActionItem {
  return {
    id: Math.random().toString(36).slice(2),
    meetingId: 'm1',
    description: 'Task',
    status: 'To Do',
    ...overrides,
  }
}

describe('KanbanBoard', () => {
  beforeEach(() => {
    // reset captured handler before each test
    capturedOnDragEnd = null
  })

  it('renders three columns', () => {
    render(<KanbanBoard items={[]} onItemUpdate={vi.fn()} />)

    expect(screen.getByTestId('kanban-column-To Do')).toBeInTheDocument()
    expect(screen.getByTestId('kanban-column-In Progress')).toBeInTheDocument()
    expect(screen.getByTestId('kanban-column-Done')).toBeInTheDocument()
  })

  it('renders items in correct columns', () => {
    const items: ActionItem[] = [
      makeItem({ id: 'a1', description: 'One', status: 'To Do' }),
      makeItem({ id: 'a2', description: 'Two', status: 'In Progress' }),
      makeItem({ id: 'a3', description: 'Three', status: 'Done' }),
    ]

    render(<KanbanBoard items={items} onItemUpdate={vi.fn()} />)

    const colTodo = screen.getByTestId('kanban-column-To Do')
    const colIn = screen.getByTestId('kanban-column-In Progress')
    const colDone = screen.getByTestId('kanban-column-Done')

    expect(within(colTodo).getByTestId('kanban-card-a1')).toBeInTheDocument()
    expect(within(colIn).getByTestId('kanban-card-a2')).toBeInTheDocument()
    expect(within(colDone).getByTestId('kanban-card-a3')).toBeInTheDocument()
  })

  it('calls onItemUpdate when dragging to a different column', async () => {
    const item = makeItem({ id: 'drag1', description: 'Drag me', status: 'To Do' })
    const onItemUpdate = vi.fn().mockResolvedValue(undefined)

    render(<KanbanBoard items={[item]} onItemUpdate={onItemUpdate} />)

    const handler = capturedOnDragEnd
    expect(typeof handler).toBe('function')

    // simulate drop into Done
    handler && handler({ active: { id: item.id }, over: { id: 'Done' } })

    // onItemUpdate is async; give promise microtask to run
    await Promise.resolve()

    expect(onItemUpdate).toHaveBeenCalledWith(item.id, 'Done' as ActionItemStatus)
  })

  it('does not call onItemUpdate when dropped on same column or over is null', async () => {
    const item = makeItem({ id: 'drag2', description: 'No-op', status: 'To Do' })
    const onItemUpdate = vi.fn().mockResolvedValue(undefined)

    render(<KanbanBoard items={[item]} onItemUpdate={onItemUpdate} />)

    const handler = capturedOnDragEnd
    expect(typeof handler).toBe('function')

    // same column
    handler && handler({ active: { id: item.id }, over: { id: 'To Do' } })
    await Promise.resolve()
    expect(onItemUpdate).not.toHaveBeenCalled()

    // over is null
    handler && handler({ active: { id: item.id }, over: null })
    await Promise.resolve()
    expect(onItemUpdate).not.toHaveBeenCalled()
  })

  it('marks overdue item with data-overdue', () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const item = makeItem({ id: 'o1', description: 'Overdue', dueDate: past, status: 'To Do' })

    render(<KanbanBoard items={[item]} onItemUpdate={vi.fn()} />)

    const card = screen.getByTestId('kanban-card-o1')
    expect(card).toHaveAttribute('data-overdue', 'true')
  })
})
