import apiClient from './client'
import type { Meeting, CreateMeetingDTO, UpdateMeetingDTO } from '../types/meeting'

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
