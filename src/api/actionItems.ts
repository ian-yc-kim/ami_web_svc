import apiClient from './client'
import type { ActionItem, UpdateActionItemDTO } from '../types/actionItem'

/**
 * Fetch action items for a meeting.
 *
 * @param meetingId - The ID of the meeting whose action items should be retrieved.
 * @returns A promise that resolves to an array of ActionItem objects associated with the meeting.
 * @throws Propagates any errors thrown by the underlying API client.
 */
export async function getActionItems(meetingId: string): Promise<ActionItem[]> {
  try {
    const response = await apiClient.get(`/meetings/${meetingId}/action-items`)
    return response.data as ActionItem[]
  } catch (error) {
    console.error('actionItems API:', error)
    throw error
  }
}

/**
 * Update an action item by id.
 *
 * @param id - The ID of the action item to update.
 * @param data - Partial action item fields to update (description, status, assignee, dueDate).
 * @returns A promise that resolves to the updated ActionItem returned by the API.
 * @throws Propagates any errors thrown by the underlying API client.
 */
export async function updateActionItem(id: string, data: UpdateActionItemDTO): Promise<ActionItem> {
  try {
    const response = await apiClient.patch(`/action-items/${id}`, data)
    return response.data as ActionItem
  } catch (error) {
    console.error('actionItems API:', error)
    throw error
  }
}
