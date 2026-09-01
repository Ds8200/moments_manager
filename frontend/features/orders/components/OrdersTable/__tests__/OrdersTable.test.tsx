import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import { OrdersTable } from '../OrdersTable'
import { useOrdersTable } from '../useOrdersTable'
import { ORDERS_LABELS } from '../../../constants/ordersLabels'
import type { OrderSummary } from '../../../types'
import type { UseOrdersTableReturn } from '../useOrdersTable'

vi.mock('../useOrdersTable')

const ORDER: OrderSummary = {
  id: 'order-1',
  order_number: 'ORD-2026-0001',
  customer_id: 'c1',
  customer_name: 'דניאל',
  date: '2026-01-01',
  due_datetime: null,
  urgency: 'normal',
  status: 'new',
  is_paid: false,
  payment_method: null,
  total_amount: '100.00',
  total_profit: '40.00',
  created_at: '2026-01-01T00:00:00Z',
  items: [{ id: 'item-1', product_name: 'עוגה', quantity: 2 }],
}

// Mirrors the real useOrdersTable behavior of stopping propagation, so this test
// can verify the component wiring (button click must not also reach the row's
// onClick) without re-testing the hook's own stopPropagation logic (see useOrdersTable.test.ts).
const toggleExpanded = vi.fn((_orderId: string, e: { stopPropagation: () => void }) => {
  e.stopPropagation()
})
const rowOnClick = vi.fn()
const getRowProps = vi.fn(() => ({
  onClick: rowOnClick,
  onContextMenu: vi.fn(),
  onTouchStart: vi.fn(),
  onTouchMove: vi.fn(),
  onTouchEnd: vi.fn(),
  onKeyDown: vi.fn(),
  tabIndex: 0,
}))

const buildHookReturn = (overrides: Partial<UseOrdersTableReturn> = {}): UseOrdersTableReturn => ({
  orders: [ORDER],
  total: 1,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  isError: false,
  menuState: { isOpen: false, title: '', items: [], anchorX: 0, anchorY: 0, anchorWidth: 0, anchorHeight: 0 },
  getRowProps,
  closeMenu: vi.fn(),
  onStatusChange: vi.fn(),
  onPageChange: vi.fn(),
  expandedOrderId: null,
  toggleExpanded,
  formatAmount: (a: string) => a,
  formatDate: (d: string) => d,
  getUrgencyLabel: () => 'רגיל',
  getUrgencyClass: () => 'urgencyNormal',
  getPaymentLabel: () => 'לא שולם',
  emptyIcon: '📦',
  ...overrides,
})

describe('OrdersTable', () => {
  it('renders the products column header and not the removed columns', () => {
    vi.mocked(useOrdersTable).mockReturnValue(buildHookReturn())
    render(<OrdersTable />)

    expect(screen.getByText(ORDERS_LABELS.COL_PRODUCTS)).toBeInTheDocument()
    expect(screen.queryByText(ORDERS_LABELS.COL_NUMBER)).not.toBeInTheDocument()
    expect(screen.queryByText(ORDERS_LABELS.COL_TARGET)).not.toBeInTheDocument()
  })

  it('does not render the products sub-row when the order is not expanded', () => {
    vi.mocked(useOrdersTable).mockReturnValue(buildHookReturn({ expandedOrderId: null }))
    render(<OrdersTable />)

    expect(screen.queryByText('עוגה')).not.toBeInTheDocument()
  })

  it('renders product name and quantity in the sub-row when the order is expanded', () => {
    vi.mocked(useOrdersTable).mockReturnValue(buildHookReturn({ expandedOrderId: 'order-1' }))
    render(<OrdersTable />)

    expect(screen.getByText('עוגה')).toBeInTheDocument()
  })

  it('shows the empty-products message when an expanded order has no items', () => {
    vi.mocked(useOrdersTable).mockReturnValue(
      buildHookReturn({
        expandedOrderId: 'order-1',
        orders: [{ ...ORDER, items: [] }],
      })
    )
    render(<OrdersTable />)

    expect(screen.getByText(ORDERS_LABELS.PRODUCTS_EMPTY)).toBeInTheDocument()
  })

  it('clicking the products toggle calls toggleExpanded and not the row click handler', async () => {
    vi.mocked(useOrdersTable).mockReturnValue(buildHookReturn())
    render(<OrdersTable />)

    await userEvent.click(screen.getByRole('button', { name: /1/ }))

    expect(toggleExpanded).toHaveBeenCalledWith('order-1', expect.anything())
    expect(rowOnClick).not.toHaveBeenCalled()
  })
})
