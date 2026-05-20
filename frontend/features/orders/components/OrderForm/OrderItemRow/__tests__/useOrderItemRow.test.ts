import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { useForm } from 'react-hook-form'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { useOrderItemRow } from '../useOrderItemRow'
import type { OrderFormValues } from '../../../../types'

const MOCK_PRODUCTS_DATA = {
  items: [
    { id: 'prod-1', name: 'T-Shirt', base_price: '50.00', base_cost: '20.00', is_active: true, category: null, avg_production_days: null, created_at: '', updated_at: '' },
    { id: 'prod-2', name: 'Hoodie',  base_price: '120.00', base_cost: '60.00', is_active: true, category: null, avg_production_days: null, created_at: '', updated_at: '' },
  ],
  total: 2, page: 1, page_size: 20, pages: 1,
}

vi.mock('@/features/products/queries/useProducts', () => ({
  useProducts: vi.fn(() => ({ data: MOCK_PRODUCTS_DATA, isPending: false })),
}))

const DEFAULT_ITEM: OrderFormValues['items'][number] = {
  product_id: null, product_name: '', quantity: 1, unit_price: '', unit_cost: '0', design_notes: '',
}

const createWrapper = () => {
  const queryClient = new QueryClient()
  function TestWrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
  return TestWrapper
}

describe('useOrderItemRow', () => {
  const buildHook = () =>
    renderHook(
      () => {
        const form = useForm<OrderFormValues>({
          defaultValues: { customer_id: '', date: '', due_datetime: '', notes: '', items: [DEFAULT_ITEM] },
        })
        return {
          hook: useOrderItemRow({
            index: 0,
            control: form.control,
            register: form.register,
            setValue: form.setValue,
            errors: form.formState.errors,
            isOnly: true,
            onRemove: vi.fn(),
          }),
          form,
        }
      },
      { wrapper: createWrapper() }
    )

  it('maps active products to autocomplete options', () => {
    const { result } = buildHook()
    expect(result.current.hook.productOptions).toHaveLength(2)
    expect(result.current.hook.productOptions[0]).toMatchObject({ value: 'prod-1', label: 'T-Shirt' })
  })

  it('onProductSelect fills product_id, product_name, unit_price, unit_cost', () => {
    const { result } = buildHook()
    const option = result.current.hook.productOptions[0]
    act(() => { result.current.hook.onProductSelect(option.value, option) })
    expect(result.current.form.getValues('items.0.product_id')).toBe('prod-1')
    expect(result.current.form.getValues('items.0.product_name')).toBe('T-Shirt')
    expect(result.current.form.getValues('items.0.unit_price')).toBe('50.00')
    expect(result.current.form.getValues('items.0.unit_cost')).toBe('20.00')
  })

  it('onProductSelect with null clears all product fields', () => {
    const { result } = buildHook()
    act(() => { result.current.hook.onProductSelect(null, null) })
    expect(result.current.form.getValues('items.0.product_id')).toBeNull()
    expect(result.current.form.getValues('items.0.product_name')).toBe('')
    expect(result.current.form.getValues('items.0.unit_price')).toBe('')
  })
})
