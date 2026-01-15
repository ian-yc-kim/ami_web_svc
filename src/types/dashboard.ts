export interface MetricsSummary {
  totalActionItems: number
  completionRate: number
  overdueCount: number
}

export interface OverdueItem {
  id: string
  description: string
  assignee: string
  /** ISO-8601 date string */
  dueDate: string
  meetingTitle: string
}

export interface TeamStat {
  assignee: string
  total: number
  completed: number
  overdue: number
}

export interface DashboardMetrics {
  summary: MetricsSummary
  overdueItems: OverdueItem[]
  teamStats: TeamStat[]
}
