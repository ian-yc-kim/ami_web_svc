import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock apiClient before importing the module under test
vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))

import apiClient from './client'
import { getMeetings, getMeeting, createMeeting, updateMeeting, analyzeMeeting } from './meetings'
import type { Meeting, CreateMeetingDTO, UpdateMeetingDTO, MeetingAnalysis } from '../types/meeting'

describe('meetings API', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.resetAllMocks()
    // suppress console.error output but keep spy to assert calls
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('getMeetings calls GET /meetings and returns data', async () => {
    const payload: Meeting[] = []
    // @ts-ignore
    apiClient.get.mockResolvedValue({ data: payload })

    const res = await getMeetings()

    expect(apiClient.get).toHaveBeenCalledWith('/meetings')
    expect(res).toEqual(payload)
  })

  it('getMeeting calls GET /meetings/:id and returns meeting', async () => {
    const meeting: Meeting = {
      id: 'm1',
      title: 'Team Sync',
      date: new Date().toISOString(),
      attendees: ['a1', 'a2'],
      notes: 'notes',
    }
    // @ts-ignore
    apiClient.get.mockResolvedValue({ data: meeting })

    const res = await getMeeting('m1')

    expect(apiClient.get).toHaveBeenCalledWith('/meetings/m1')
    expect(res).toEqual(meeting)
  })

  it('createMeeting posts to /meetings with payload and returns created meeting', async () => {
    const dto: CreateMeetingDTO = {
      title: 'Planning',
      date: new Date().toISOString(),
      attendees: ['u1'],
      notes: 'prep',
    }
    const created: Meeting = { id: 'new', ...dto }
    // @ts-ignore
    apiClient.post.mockResolvedValue({ data: created })

    const res = await createMeeting(dto)

    expect(apiClient.post).toHaveBeenCalledWith('/meetings', dto)
    expect(res).toEqual(created)
  })

  it('updateMeeting puts to /meetings/:id with payload and returns updated meeting', async () => {
    const partial: UpdateMeetingDTO = { notes: 'updated' }
    const updated: Meeting = {
      id: 'm1',
      title: 'Old',
      date: new Date().toISOString(),
      attendees: [],
      notes: 'updated',
    }
    // @ts-ignore
    apiClient.put.mockResolvedValue({ data: updated })

    const res = await updateMeeting('m1', partial)

    expect(apiClient.put).toHaveBeenCalledWith('/meetings/m1', partial)
    expect(res).toEqual(updated)
  })

  it('analyzeMeeting calls POST /meetings/:id/analyze and returns data', async () => {
    const payload: MeetingAnalysis = {
      summary: 'Meeting summary',
      keyDiscussionPoints: ['topic1', 'topic2'],
      decisions: ['decision1'],
    }
    // @ts-ignore
    apiClient.post.mockResolvedValue({ data: payload })

    const res = await analyzeMeeting('m1')

    expect(apiClient.post).toHaveBeenCalledWith('/meetings/m1/analyze')
    expect(res).toEqual(payload)
  })

  it('propagates errors from apiClient (analyzeMeeting)', async () => {
    const error = new Error('analyze error')
    // @ts-ignore
    apiClient.post.mockRejectedValue(error)

    await expect(analyzeMeeting('m1')).rejects.toBe(error)
    expect(console.error).toHaveBeenCalled()
  })

  it('propagates errors from apiClient (getMeetings)', async () => {
    const error = new Error('server')
    // @ts-ignore
    apiClient.get.mockRejectedValue(error)

    await expect(getMeetings()).rejects.toBe(error)
    expect(console.error).toHaveBeenCalled()
  })
})
