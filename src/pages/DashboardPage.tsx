import { useEffect, useState } from 'react';
import { getDashboardMetrics } from '../api/dashboard';
import type { DashboardMetrics } from '../types/dashboard';
import MetricCard from '../components/dashboard/MetricCard';
import OverdueList from '../components/dashboard/OverdueList';
import TeamStats from '../components/dashboard/TeamStats';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardMetrics()
      .then(data => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load dashboard metrics.');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="dashboard-loading">Loading...</div>;
  if (error) return <div className="dashboard-error">{error}</div>;
  if (!metrics) return null;

  return (
    <main className="dashboard-page">
      <h2>Team Dashboard</h2>
      <div className="dashboard-metrics">
        <MetricCard title="Total Action Items" value={metrics.summary.totalActionItems} />
        <MetricCard title="Completion Rate" value={`${metrics.summary.completionRate}%`} />
        <MetricCard title="Overdue Items" value={metrics.summary.overdueCount} type="danger" />
      </div>
      <div className="dashboard-content">
        <div className="dashboard-section">
          <h3>Overdue Items</h3>
          <OverdueList items={metrics.overdueItems} />
        </div>
        <div className="dashboard-section">
          <h3>Team Statistics</h3>
          <TeamStats stats={metrics.teamStats} />
        </div>
      </div>
    </main>
  );
}
