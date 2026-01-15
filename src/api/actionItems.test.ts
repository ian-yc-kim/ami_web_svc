import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

import apiClient from './client'
import { getActionItems, updateActionItem } from './actionItems'
import type { ActionItem, UpdateActionItemDTO } from '../types/actionItem'

describe('actionItems API', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.resetAllMocks()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('getActionItems calls GET /meetings/:id/action-items and returns data', async () => {
    const payload: ActionItem[] = [
      {
        id: 'ai1',
        meetingId: 'm1',
        description: 'Do X',
        status: 'To Do',
        assignee: 'u1',
        dueDate: new Date().toISOString(),
      },
    ]
    // @ts-ignore
    apiClient.get.mockResolvedValue({ data: payload })

    const res = await getActionItems('m1')

    expect(apiClient.get).toHaveBeenCalledWith('/meetings/m1/action-items')
    expect(res).toEqual(payload)
  })

  it('updateActionItem calls PATCH /action-items/:id with payload and returns updated', async () => {
    const updated: ActionItem = {
      id: 'ai1',
      meetingId: 'm1',
      description: 'Updated',
      status: 'Done',
      assignee: 'u2',
      dueDate: new Date().toISOString(),
    }
    const dto: UpdateActionItemDTO = { status: 'Done' }
    // @ts-ignore
    apiClient.patch.mockResolvedValue({ data: updated })

    const res = await updateActionItem('ai1', dto)

    expect(apiClient.patch).toHaveBeenCalledWith('/action-items/ai1', dto)
    expect(res).toEqual(updated)
  })

  it('propagates errors from apiClient (getActionItems)', async () => {
    const error = new Error('failed')
    // @ts-ignore
    apiClient.get.mockRejectedValue(error)

    await expect(getActionItems('m1')).rejects.toBe(error)
    expect(console.error).toHaveBeenCalled()
  })

  it('propagates errors from apiClient (updateActionItem)', async () => {
    const error = new Error('patch failed')
    // @ts-ignore
    apiClient.patch.mockRejectedValue(error)

    await expect(updateActionItem('ai1', { status: 'Done' })).rejects.toBe(error)
    expect(console.error).toHaveBeenCalled()
  })
})
