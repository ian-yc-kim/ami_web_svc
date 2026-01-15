import apiClient from './client'
import type { ActionItem, UpdateActionItemDTO } from '../types/actionItem'

export async function getActionItems(meetingId: string): Promise<ActionItem[]> {
  try {
    const response = await apiClient.get(`/meetings/${meetingId}/action-items`)
    return response.data as ActionItem[]
  } catch (error) {
    console.error('actionItems API:', error)
    throw error
  }
}

export async function updateActionItem(id: string, data: UpdateActionItemDTO): Promise<ActionItem> {
  try {
    const response = await apiClient.patch(`/action-items/${id}`, data)
    return response.data as ActionItem
  } catch (error) {
    console.error('actionItems API:', error)
    throw error
  }
}
