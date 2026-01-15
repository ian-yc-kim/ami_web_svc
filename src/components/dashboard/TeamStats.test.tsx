import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TeamStats from './TeamStats'

describe('TeamStats', () => {
  it('renders table rows for each stat', () => {
    const stats = [
      { assignee: 'Alice', total: 5, completed: 4, overdue: 1 },
      { assignee: 'Bob', total: 4, completed: 4, overdue: 0 },
    ]

    render(<TeamStats stats={stats} />)

    const rowAlice = screen.getByTestId('teamstat-row-Alice')
    const cellsAlice = rowAlice.querySelectorAll('td')
    expect(cellsAlice[0].textContent).toBe('Alice')
    expect(cellsAlice[1].textContent).toBe('5')
    expect(cellsAlice[2].textContent).toBe('4')
    expect(cellsAlice[3].textContent).toBe('1')

    const rowBob = screen.getByTestId('teamstat-row-Bob')
    const cellsBob = rowBob.querySelectorAll('td')
    expect(cellsBob[0].textContent).toBe('Bob')
    expect(cellsBob[1].textContent).toBe('4')
    expect(cellsBob[2].textContent).toBe('4')
    expect(cellsBob[3].textContent).toBe('0')
  })

  it('renders empty state when there are no stats', () => {
    render(<TeamStats stats={[]} />)
    expect(screen.getByText(/No team stats\./i)).toBeInTheDocument()
  })
})
