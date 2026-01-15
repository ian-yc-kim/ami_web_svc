interface MetricCardProps {
  title: string
  value: number | string
  type?: 'default' | 'danger'
}

export default function MetricCard(props: MetricCardProps) {
  const { title, value, type = 'default' } = props
  const className = `dashboard-card ${type === 'danger' ? 'dashboard-card--danger' : ''}`.trim()

  return (
    <div className={className} role="region" aria-label={title}>
      <div className="dashboard-card__title">{title}</div>
      <div className="dashboard-card__value">{value}</div>
    </div>
  )
}
