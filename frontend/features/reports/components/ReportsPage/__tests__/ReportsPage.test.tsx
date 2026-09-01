import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReportsPage } from '../ReportsPage'
import { formatCurrency } from '@/shared/utils/formatters'

function renderWithProviders(): ReturnType<typeof render> {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ReportsPage />
    </QueryClientProvider>
  )
}

describe('ReportsPage', () => {
  // Regression test: the monthly "רווח" column must render net profit
  // (after expenses), not gross profit. The MSW mock for REPORTS_FINANCIAL
  // returns total_profit: '3800' and net_profit: '2800' — distinct values —
  // precisely so a regression to the pre-fix bug is detectable.
  it('renders net profit, not gross profit, in the monthly profit column', async () => {
    renderWithProviders()

    const monthCell = await waitFor(() => screen.getByText('ינואר'))
    const row = monthCell.closest('tr')
    if (!row) throw new Error('month row not found')
    const cells = row.querySelectorAll('td')
    const profitCell = cells[cells.length - 1]

    // net_profit ('2800') — correct; total_profit ('3800') would be the pre-fix bug.
    expect(profitCell.textContent).toBe(formatCurrency('2800'))
    expect(profitCell.textContent).not.toBe(formatCurrency('3800'))
  })

  it('renders material cost (total_cost) as its own column, right before profit', async () => {
    renderWithProviders()

    const monthCell = await waitFor(() => screen.getByText('ינואר'))
    const row = monthCell.closest('tr')
    if (!row) throw new Error('month row not found')
    const cells = row.querySelectorAll('td')
    const materialCostCell = cells[cells.length - 2]

    expect(materialCostCell.textContent).toBe(formatCurrency('1200'))
  })
})
