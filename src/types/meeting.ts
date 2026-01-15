export interface Meeting {
  id: string
  title: string
  /** ISO-8601 date string */
  date: string
  attendees: string[]
  notes: string
}

export interface CreateMeetingDTO {
  title: string
  /** ISO-8601 date string */
  date: string
  attendees: string[]
  notes: string
}

export type UpdateMeetingDTO = Partial<CreateMeetingDTO>

export interface MeetingAnalysis {
  summary: string
  keyDiscussionPoints: string[]
  decisions: string[]
}
