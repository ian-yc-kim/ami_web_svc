import type { OverdueItem } from '../../types/dashboard'

interface OverdueListProps {
  items: OverdueItem[]
}

function formatDueDate(iso?: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).format(d)
  } catch (error) {
    console.error('Component:', error)
    return iso
  }
}

export default function OverdueList(props: OverdueListProps) {
  const { items } = props

  if (!items || items.length === 0) {
    return <div className="dashboard-empty">No overdue items.</div>
  }

  return (
    <div className="dashboard-overdue-list">
      <table className="dashboard-table" aria-label="Overdue items table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Assignee</th>
            <th>Due Date</th>
            <th>Meeting</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} data-testid={`overdue-row-${it.id}`}>
              <td>{it.description}</td>
              <td>{it.assignee}</td>
              <td>{formatDueDate(it.dueDate)}</td>
              <td>{it.meetingTitle}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
