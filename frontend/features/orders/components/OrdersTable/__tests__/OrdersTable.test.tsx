import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import { OrdersTable } from '../OrdersTable'
import { useOrdersTable } from '../useOrdersTable'
import { ORDERS_LABELS } from '../../../constants/ordersLabels'
import type { OrderSummary } from '../../../types'
import type { UseOrdersTableReturn, ProductsPopoverData } from '../useOrdersTable'
import type { AnchoredPopoverState } from '@/shared/components/AnchoredPopover/useAnchoredPopover'

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

const CLOSED_POPOVER: AnchoredPopoverState<ProductsPopoverData> = { isOpen: false }

// Mirrors the real useOrdersTable behavior of stopping propagation, so this test
// can verify the component wiring (button click must not also reach the row's
// onClick) without re-testing the hook's own stopPropagation logic (see useOrdersTable.test.ts).
const toggleProductsPopover = vi.fn((_order: OrderSummary, e: { stopPropagation: () => void }) => {
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
  productsPopover: CLOSED_POPOVER,
  toggleProductsPopover,
  closeProductsPopover: vi.fn(),
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

  it('does not render the products popover when it is closed', () => {
    vi.mocked(useOrdersTable).mockReturnValue(buildHookReturn({ productsPopover: CLOSED_POPOVER }))
    render(<OrdersTable />)

    expect(screen.queryByText('עוגה')).not.toBeInTheDocument()
  })

  it('renders product name and quantity in the popover when it is open for that order', () => {
    vi.mocked(useOrdersTable).mockReturnValue(
      buildHookReturn({
        productsPopover: {
          isOpen: true,
          data: { orderId: 'order-1', items: ORDER.items },
          anchorEl: document.createElement('button'),
        },
      })
    )
    render(<OrdersTable />)

    expect(screen.getByText('עוגה')).toBeInTheDocument()
  })

  it('shows the empty-products message when the open popover has no items', () => {
    vi.mocked(useOrdersTable).mockReturnValue(
      buildHookReturn({
        productsPopover: {
          isOpen: true,
          data: { orderId: 'order-1', items: [] },
          anchorEl: document.createElement('button'),
        },
      })
    )
    render(<OrdersTable />)

    expect(screen.getByText(ORDERS_LABELS.PRODUCTS_EMPTY)).toBeInTheDocument()
  })

  it('clicking the products toggle calls toggleProductsPopover and not the row click handler', async () => {
    vi.mocked(useOrdersTable).mockReturnValue(buildHookReturn())
    render(<OrdersTable />)

    await userEvent.click(screen.getByRole('button', { name: /1/ }))

    expect(toggleProductsPopover).toHaveBeenCalledWith(ORDER, expect.anything())
    expect(rowOnClick).not.toHaveBeenCalled()
  })
})
