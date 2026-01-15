export interface CreateActionItemDTO {
  description: string
  assignee?: string
  /** ISO-8601 date string */
  dueDate?: string
  priority?: ActionItemPriority
}

export type ActionItemStatus = 'To Do' | 'In Progress' | 'Done'
export type ActionItemPriority = 'Low' | 'Medium' | 'High'

export interface ActionItem {
  id: string
  meetingId: string
  description: string
  status: ActionItemStatus
  assignee?: string
  /** ISO-8601 date string */
  dueDate?: string
  priority?: ActionItemPriority
}

export interface UpdateActionItemDTO {
  description?: string
  status?: ActionItemStatus
  assignee?: string
  /** ISO-8601 date string */
  dueDate?: string
  priority?: ActionItemPriority
}
