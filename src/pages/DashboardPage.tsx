import { useEffect, useState, type ReactElement } from 'react'
import type { DashboardMetrics } from '../types/dashboard'
import { getDashboardMetrics } from '../api/dashboard'
import MetricCard from '../components/dashboard/MetricCard'
import OverdueList from '../components/dashboard/OverdueList'
import TeamStats from '../components/dashboard/TeamStats'

function formatCompletionRate(rate: number): string {
  if (rate == null || Number.isNaN(rate)) return '0%'
  try {
    if (rate <= 1) return `${Math.round(rate * 100)}%`
    return `${Math.round(rate)}%`
  } catch (error) {
    console.error('Component:', error)
    return '0%'
  }
}

export default function DashboardPage(): ReactElement {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchMetrics = async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await getDashboardMetrics()
        if (!mounted) return
        setMetrics(res)
      } catch (err) {
        console.error('Component:', err)
        if (!mounted) return
        setError('Failed to load dashboard metrics.')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    void fetchMetrics()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <main>
      <h2>Team Dashboard</h2>

      {loading && <div role="status">Loading...</div>}

      {error && !loading && (
        <div role="alert">{error}</div>
      )}

      {!loading && !error && !metrics && (
        <div className="dashboard-empty">No dashboard data.</div>
      )}

      {!loading && !error && metrics && (
        <section>
          <div className="dashboard-metrics">
            <MetricCard title="Total Items" value={metrics.summary.totalActionItems} />
            <MetricCard title="Completion Rate" value={formatCompletionRate(metrics.summary.completionRate)} />
            <MetricCard
              title="Overdue Items"
              value={metrics.summary.overdueCount}
              type={metrics.summary.overdueCount > 0 ? 'danger' : 'default'}
            />
          </div>

          <div className="dashboard-content">
            <div>
              <h3>Overdue</h3>
              <OverdueList items={metrics.overdueItems} />
            </div>

            <div>
              <h3>Team Stats</h3>
              <TeamStats stats={metrics.teamStats} />
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
