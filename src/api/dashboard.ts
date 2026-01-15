import apiClient from './client'
import type { DashboardMetrics } from '../types/dashboard'

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const response = await apiClient.get('/dashboard/metrics')
    return response.data as DashboardMetrics
  } catch (error) {
    console.error('dashboard API:', error)
    throw error
  }
}
