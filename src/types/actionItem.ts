export interface CreateActionItemDTO {
  description: string
  assignee?: string
  /** ISO-8601 date string */
  dueDate?: string
}

export type ActionItemStatus = 'To Do' | 'In Progress' | 'Done'

export interface ActionItem {
  id: string
  meetingId: string
  description: string
  status: ActionItemStatus
  assignee?: string
  /** ISO-8601 date string */
  dueDate?: string
}

export interface UpdateActionItemDTO {
  description?: string
  status?: ActionItemStatus
  assignee?: string
  /** ISO-8601 date string */
  dueDate?: string
}
