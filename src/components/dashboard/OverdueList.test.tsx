/// <reference types="vitest" />
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import OverdueList from './OverdueList'
import type { OverdueItem } from '../../types/dashboard'

function makeItem(overrides?: Partial<OverdueItem>): OverdueItem {
  return {
    id: Math.random().toString(36).slice(2),
    description: 'Fix bug',
    assignee: 'Alice',
    dueDate: new Date().toISOString(),
    meetingTitle: 'Sprint Planning',
    ...overrides,
  }
}

describe('OverdueList', () => {
  it('renders table with provided items', () => {
    const items: OverdueItem[] = [makeItem({ description: 'One' }), makeItem({ description: 'Two', assignee: 'Bob' })]
    render(<OverdueList items={items} />)

    // headers
    expect(screen.getByRole('columnheader', { name: /Description/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /Assignee/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /Due Date/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /Meeting/i })).toBeInTheDocument()

    // rows
    const rowOne = screen.getByTestId(`overdue-row-${items[0].id}`)
    expect(within(rowOne).getByText('One')).toBeInTheDocument()
    expect(within(rowOne).getByText('Alice')).toBeInTheDocument()

    const rowTwo = screen.getByTestId(`overdue-row-${items[1].id}`)
    expect(within(rowTwo).getByText('Two')).toBeInTheDocument()
    expect(within(rowTwo).getByText('Bob')).toBeInTheDocument()
  })

  it('renders empty state when no items', () => {
    render(<OverdueList items={[]} />)
    expect(screen.getByText('No overdue items.')).toBeInTheDocument()
    // table should not be present
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
