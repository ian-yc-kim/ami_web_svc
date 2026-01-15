/// <reference types="vitest" />
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MetricCard from './MetricCard'

describe('MetricCard', () => {
  it('renders title and numeric value', () => {
    render(<MetricCard title="Overdue" value={3} />)
    expect(screen.getByText('Overdue')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders string value', () => {
    render(<MetricCard title="Rate" value="75%" />)
    expect(screen.getByText('Rate')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('applies danger styling when type is danger', () => {
    render(<MetricCard title="Late" value={1} type="danger" />)
    const region = screen.getByRole('region', { name: 'Late' })
    expect(region.className).toContain('dashboard-card--danger')
  })
})
