import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { ExpensesTable } from '../ExpensesTable'
import { useExpensesTable } from '../useExpensesTable'
import type { Expense } from '../../../types'
import type { UseExpensesTableReturn } from '../useExpensesTable'

vi.mock('../useExpensesTable')

const EXPENSE: Expense = {
  id: 'expense-1',
  date: '2026-01-01',
  category_id: null,
  category: null,
  amount: '100.00',
  notes: '',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const getRowProps = vi.fn(() => ({
  onClick: vi.fn(),
  onContextMenu: vi.fn(),
  onTouchStart: vi.fn(),
  onTouchMove: vi.fn(),
  onTouchEnd: vi.fn(),
  onKeyDown: vi.fn(),
  tabIndex: 0,
}))

const buildHookReturn = (overrides: Partial<UseExpensesTableReturn> = {}): UseExpensesTableReturn => ({
  expenses: [EXPENSE],
  total: 1,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  isError: false,
  menuState: { isOpen: false, title: '', items: [], anchorX: 0, anchorY: 0, anchorWidth: 0, anchorHeight: 0 },
  getRowProps,
  closeMenu: vi.fn(),
  onPageChange: vi.fn(),
  formatAmount: (a) => String(a),
  formatExpenseDate: (d) => d,
  emptyIcon: '💸',
  emptyValue: '—',
  ...overrides,
})

describe('ExpensesTable', () => {
  it('shows the em-dash placeholder for a missing category and an empty-string notes, never a blank cell', () => {
    vi.mocked(useExpensesTable).mockReturnValue(buildHookReturn())
    render(<ExpensesTable />)

    const dashes = screen.getAllByText('—')
    expect(dashes).toHaveLength(2)
  })

  it('shows the real category and notes when present, not the placeholder', () => {
    vi.mocked(useExpensesTable).mockReturnValue(
      buildHookReturn({
        expenses: [{
          ...EXPENSE,
          category: { id: 'cat-1', name: 'דיו', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
          notes: 'הערה',
        }],
      })
    )
    render(<ExpensesTable />)

    expect(screen.getByText('דיו')).toBeInTheDocument()
    expect(screen.getByText('הערה')).toBeInTheDocument()
    expect(screen.queryByText('—')).not.toBeInTheDocument()
  })
})
