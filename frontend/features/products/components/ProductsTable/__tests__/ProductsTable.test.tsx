import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { ProductsTable } from '../ProductsTable'
import { useProductsTable } from '../useProductsTable'
import { PRODUCTS_LABELS } from '../../../constants/productsLabels'
import type { Product } from '../../../types'
import type { UseProductsTableReturn } from '../useProductsTable'

vi.mock('../useProductsTable')

const PRODUCT: Product = {
  id: 'product-1',
  name: 'כרזה',
  category_id: null,
  category: null,
  base_price: '100.00',
  base_cost: '40.00',
  avg_production_days: null,
  is_active: true,
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

const buildHookReturn = (overrides: Partial<UseProductsTableReturn> = {}): UseProductsTableReturn => ({
  products: [PRODUCT],
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
  emptyIcon: '🖼️',
  emptyValue: '—',
  ...overrides,
})

describe('ProductsTable', () => {
  it('shows the em-dash placeholder for a missing category, never a blank cell', () => {
    vi.mocked(useProductsTable).mockReturnValue(buildHookReturn())
    render(<ProductsTable />)

    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows the real category name when present, not the placeholder', () => {
    vi.mocked(useProductsTable).mockReturnValue(
      buildHookReturn({
        products: [{
          ...PRODUCT,
          category: { id: 'cat-1', name: 'הדפסות', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
        }],
      })
    )
    render(<ProductsTable />)

    expect(screen.getByText('הדפסות')).toBeInTheDocument()
    expect(screen.queryByText('—')).not.toBeInTheDocument()
    expect(screen.getByText(PRODUCTS_LABELS.ACTIVE_LABEL)).toBeInTheDocument()
  })
})
