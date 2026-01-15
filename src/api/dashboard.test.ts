import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
  },
}))

import apiClient from './client'
import { getDashboardMetrics } from './dashboard'
import type { DashboardMetrics } from '../types/dashboard'

describe('dashboard API', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.resetAllMocks()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('getDashboardMetrics calls GET /dashboard/metrics and returns data', async () => {
    const payload: DashboardMetrics = {
      summary: { totalActionItems: 10, completionRate: 0.75, overdueCount: 2 },
      overdueItems: [
        {
          id: 'o1',
          description: 'Overdue task',
          assignee: 'u1',
          dueDate: new Date().toISOString(),
          meetingTitle: 'Sprint Planning',
        },
      ],
      teamStats: [
        { assignee: 'u1', total: 5, completed: 4, overdue: 1 },
      ],
    }

    // @ts-ignore
    apiClient.get.mockResolvedValue({ data: payload })

    const res = await getDashboardMetrics()

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/metrics')
    expect(res).toEqual(payload)
  })

  it('propagates errors from apiClient (getDashboardMetrics)', async () => {
    const error = new Error('failed')
    // @ts-ignore
    apiClient.get.mockRejectedValue(error)

    await expect(getDashboardMetrics()).rejects.toBe(error)
    expect(console.error).toHaveBeenCalled()
  })
})
