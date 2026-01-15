import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ActionItemReviewModal from './ActionItemReviewModal'
import * as meetingsApi from '../api/meetings'
import type { CreateActionItemDTO } from '../types/actionItem'

vi.mock('../api/meetings')

describe('ActionItemReviewModal', () => {
  // Avoid referencing vi.Mock in types to keep tests TypeScript-build friendly
  const api = meetingsApi as unknown as { createActionItems: (...args: unknown[]) => Promise<unknown> }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('does not render when closed', () => {
    render(
      <ActionItemReviewModal isOpen={false} onClose={() => {}} meetingId="m1" initialItems={[]} />,
    )

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders initial items and inputs show values', () => {
    const items: CreateActionItemDTO[] = [
      { description: 'Do thing', assignee: 'Alice', dueDate: '2024-01-02T00:00:00Z' },
      { description: 'Other', assignee: undefined, dueDate: undefined },
    ]

    render(
      <ActionItemReviewModal isOpen onClose={() => {}} meetingId="m1" initialItems={items} />,
    )

    expect(screen.getByDisplayValue('Do thing')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
    // date input should show YYYY-MM-DD
    expect(screen.getByDisplayValue('2024-01-02')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Other')).toBeInTheDocument()
  })

  it('calls createActionItems with updated items on save', async () => {
    const items: CreateActionItemDTO[] = [{ description: 'Initial', assignee: '', dueDate: undefined }]
    api.createActionItems = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()

    render(
      <ActionItemReviewModal isOpen onClose={onClose} meetingId="meet-123" initialItems={items} />,
    )

    const desc = screen.getByLabelText(/Description/i)
    const assignee = screen.getByLabelText(/Assignee/i)
    const addDue = screen.getByLabelText(/Due date/i)

    await userEvent.clear(desc)
    await userEvent.type(desc, 'Updated task')
    await userEvent.clear(assignee)
    await userEvent.type(assignee, 'Bob')
    // set date to 2025-02-03
    fireEvent.change(addDue, { target: { value: '2025-02-03' } })

    const save = screen.getByRole('button', { name: /save/i })
    await userEvent.click(save)

    await waitFor(() => expect(api.createActionItems).toHaveBeenCalled())
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('shows loading state while saving and calls onClose on success', async () => {
    let resolve!: (v?: unknown) => void
    const p = new Promise((res) => {
      resolve = res
    })
    api.createActionItems = vi.fn().mockReturnValue(p)
    const onClose = vi.fn()

    render(
      <ActionItemReviewModal isOpen onClose={onClose} meetingId="m1" initialItems={[]} />,
    )

    const save = screen.getByRole('button', { name: /save/i })
    expect(save).toBeEnabled()
    fireEvent.click(save)

    // while pending, button should show Saving... and be disabled
    expect(screen.getByRole('button', { name: /saving.../i })).toBeDisabled()

    // finish promise
    resolve(undefined)
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('displays error when API fails', async () => {
    api.createActionItems = vi.fn().mockRejectedValue(new Error('Network'))

    render(
      <ActionItemReviewModal isOpen onClose={() => {}} meetingId="m1" initialItems={[]} />,
    )

    const save = screen.getByRole('button', { name: /save/i })
    fireEvent.click(save)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/Network/i)
  })
})
