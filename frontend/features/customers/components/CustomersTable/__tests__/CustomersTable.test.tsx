import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { CustomersTable } from '../CustomersTable'
import { useCustomersTable } from '../useCustomersTable'
import type { Customer } from '../../../types'
import type { UseCustomersTableReturn } from '../useCustomersTable'

vi.mock('../useCustomersTable')

const CUSTOMER: Customer = {
  id: 'customer-1',
  name: 'דניאל',
  phone: '',
  email: '',
  notes: null,
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

const buildHookReturn = (overrides: Partial<UseCustomersTableReturn> = {}): UseCustomersTableReturn => ({
  customers: [CUSTOMER],
  total: 1,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  isError: false,
  menuState: { isOpen: false, title: '', items: [], anchorX: 0, anchorY: 0, anchorWidth: 0, anchorHeight: 0 },
  getRowProps,
  closeMenu: vi.fn(),
  onPageChange: vi.fn(),
  emptyIcon: '👤',
  emptyValue: '—',
  ...overrides,
})

describe('CustomersTable', () => {
  it('shows the em-dash placeholder for an empty-string phone and email, never a blank cell', () => {
    vi.mocked(useCustomersTable).mockReturnValue(buildHookReturn())
    render(<CustomersTable />)

    const dashes = screen.getAllByText('—')
    expect(dashes).toHaveLength(2)
  })

  it('shows the real phone and email when present, not the placeholder', () => {
    vi.mocked(useCustomersTable).mockReturnValue(
      buildHookReturn({ customers: [{ ...CUSTOMER, phone: '050-1234567', email: 'd@example.com' }] })
    )
    render(<CustomersTable />)

    expect(screen.getByText('050-1234567')).toBeInTheDocument()
    expect(screen.getByText('d@example.com')).toBeInTheDocument()
    expect(screen.queryByText('—')).not.toBeInTheDocument()
  })
})
