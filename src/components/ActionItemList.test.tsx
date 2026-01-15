/// <reference types="vitest" />
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ActionItemList from './ActionItemList'
import type { ActionItem, ActionItemStatus } from '../types/actionItem'

function makeItem(overrides?: Partial<ActionItem>): ActionItem {
  const base: ActionItem = {
    id: Math.random().toString(36).slice(2),
    meetingId: 'm1',
    description: 'Do something',
    status: 'To Do',
  }
  return { ...base, ...overrides }
}

describe('ActionItemList', () => {
  it('renders multiple items with descriptions and assignees when present', () => {
    const items: ActionItem[] = [
      makeItem({ description: 'First task', assignee: 'Alice', status: 'To Do' }),
      makeItem({ description: 'Second task', status: 'In Progress' }),
    ]

    const onItemUpdate = vi.fn().mockResolvedValue(undefined)

    render(<ActionItemList items={items} onItemUpdate={onItemUpdate} />)

    const rendered = screen.getAllByTestId('action-item')
    expect(rendered.length).toBe(2)

    expect(screen.getByText('First task')).toBeInTheDocument()
    expect(screen.getByText('Second task')).toBeInTheDocument()

    // assignee present for first only
    const first = rendered[0]
    expect(within(first).getByText('Alice')).toBeInTheDocument()

    const second = rendered[1]
    expect(within(second).queryByText('Alice')).not.toBeInTheDocument()

    // selects exist and have correct selected values
    const firstSelect = within(first).getByRole('combobox') as HTMLSelectElement
    const secondSelect = within(second).getByRole('combobox') as HTMLSelectElement
    expect(firstSelect.value).toBe('To Do')
    expect(secondSelect.value).toBe('In Progress')
  })

  it('calls onItemUpdate with correct args when status changes', async () => {
    const item = makeItem({ description: 'Change status', status: 'To Do' })
    const onItemUpdate = vi.fn().mockResolvedValue(undefined)
    render(<ActionItemList items={[item]} onItemUpdate={onItemUpdate} />)

    const user = userEvent.setup()
    const select = screen.getByRole('combobox') as HTMLSelectElement

    await user.selectOptions(select, 'Done')

    await waitFor(() => {
      expect(onItemUpdate).toHaveBeenCalledWith(item.id, 'Done' as ActionItemStatus)
    })
  })

  it('disables the select while update is pending and re-enables after', async () => {
    const item = makeItem({ status: 'To Do' })

    let resolve!: () => void
    const pendingPromise = new Promise<void>((r) => {
      resolve = r
    })

    const onItemUpdate = vi.fn().mockReturnValue(pendingPromise)

    render(<ActionItemList items={[item]} onItemUpdate={onItemUpdate} />)
    const user = userEvent.setup()
    const select = screen.getByRole('combobox') as HTMLSelectElement

    // Start change
    const change = user.selectOptions(select, 'In Progress')

    // Immediately should be disabled
    await waitFor(() => expect(select).toBeDisabled())

    // resolve the pending promise
    resolve()
    await change

    // after resolution, should be enabled
    await waitFor(() => expect(select).not.toBeDisabled())
  })

  it('marks overdue items with data-overdue when dueDate is past and not done', () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const items: ActionItem[] = [
      makeItem({ id: 'o1', description: 'Overdue not done', dueDate: past, status: 'To Do' }),
      makeItem({ id: 'o2', description: 'Overdue but done', dueDate: past, status: 'Done' }),
    ]

    const onItemUpdate = vi.fn().mockResolvedValue(undefined)

    render(<ActionItemList items={items} onItemUpdate={onItemUpdate} />)

    const all = screen.getAllByTestId('action-item')
    // find the one with description text
    const overdueNotDone = all.find((el) => el.textContent?.includes('Overdue not done'))
    const overdueDone = all.find((el) => el.textContent?.includes('Overdue but done'))

    expect(overdueNotDone).toBeDefined()
    expect(overdueDone).toBeDefined()

    expect(overdueNotDone).toHaveAttribute('data-overdue', 'true')
    expect(overdueDone).not.toHaveAttribute('data-overdue')
  })
})
