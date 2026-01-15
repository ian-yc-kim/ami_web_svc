export interface CreateActionItemDTO {
  description: string
  assignee?: string
  /** ISO-8601 date string */
  dueDate?: string
}
