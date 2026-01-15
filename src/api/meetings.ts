import apiClient from './client'
import type { Meeting, CreateMeetingDTO, UpdateMeetingDTO, MeetingAnalysis } from '../types/meeting'
import type { CreateActionItemDTO } from '../types/actionItem'

export async function getMeetings(): Promise<Meeting[]> {
  try {
    const response = await apiClient.get('/meetings')
    return response.data as Meeting[]
  } catch (error) {
    console.error('meetings API:', error)
    throw error
  }
}

export async function getMeeting(id: string): Promise<Meeting> {
  try {
    const response = await apiClient.get(`/meetings/${id}`)
    return response.data as Meeting
  } catch (error) {
    console.error('meetings API:', error)
    throw error
  }
}

export async function createMeeting(data: CreateMeetingDTO): Promise<Meeting> {
  try {
    const response = await apiClient.post('/meetings', data)
    return response.data as Meeting
  } catch (error) {
    console.error('meetings API:', error)
    throw error
  }
}

export async function updateMeeting(id: string, data: UpdateMeetingDTO): Promise<Meeting> {
  try {
    const response = await apiClient.put(`/meetings/${id}`, data)
    return response.data as Meeting
  } catch (error) {
    console.error('meetings API:', error)
    throw error
  }
}

export async function analyzeMeeting(id: string): Promise<MeetingAnalysis> {
  try {
    const response = await apiClient.post(`/meetings/${id}/analyze`)
    return response.data as MeetingAnalysis
  } catch (error) {
    console.error('meetings API:', error)
    throw error
  }
}

export async function createActionItems(meetingId: string, items: CreateActionItemDTO[]): Promise<void> {
  try {
    await apiClient.post('/action-items', { meetingId, items })
  } catch (error) {
    console.error('meetings API:', error)
    throw error
  }
}
