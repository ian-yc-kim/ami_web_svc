import type { TeamStat } from '../../types/dashboard'

interface TeamStatsProps {
  stats: TeamStat[]
}

export default function TeamStats(props: TeamStatsProps) {
  const { stats } = props

  if (!stats || stats.length === 0) {
    return <div className="dashboard-empty">No team stats.</div>
  }

  return (
    <div className="dashboard-team-stats">
      <table className="dashboard-table" aria-label="Team stats table">
        <thead>
          <tr>
            <th>Assignee</th>
            <th>Total Items</th>
            <th>Completed</th>
            <th>Overdue</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <tr key={s.assignee} data-testid={`teamstat-row-${s.assignee}`}>
              <td>{s.assignee}</td>
              <td>{s.total}</td>
              <td>{s.completed}</td>
              <td>{s.overdue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
