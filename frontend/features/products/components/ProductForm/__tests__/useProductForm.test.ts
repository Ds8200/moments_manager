import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { useProductForm } from '../useProductForm'

const createMutateAsync = vi.fn().mockResolvedValue({ id: 'new' })
const updateMutateAsync = vi.fn().mockResolvedValue({ id: 'existing' })

vi.mock('../../../queries/useProducts', () => ({
  useProduct: () => ({ data: undefined }),
  useCreateProduct: () => ({ mutateAsync: createMutateAsync }),
  useUpdateProduct: () => ({ mutateAsync: updateMutateAsync }),
}))

vi.mock('@/features/productCategories', () => ({
  useProductCategories: () => ({ data: [] }),
}))

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client }, children)
}

describe('useProductForm', () => {
  beforeEach(() => {
    createMutateAsync.mockClear()
    updateMutateAsync.mockClear()
  })

  it('isOpen and isEditing are false initially', () => {
    const { result } = renderHook(() => useProductForm(), { wrapper })
    expect(result.current.isOpen).toBe(false)
    expect(result.current.isEditing).toBe(false)
  })

  it('isCategoryManagerOpen is false initially', () => {
    const { result } = renderHook(() => useProductForm(), { wrapper })
    expect(result.current.isCategoryManagerOpen).toBe(false)
  })

  it('openCategoryManager sets isCategoryManagerOpen to true', async () => {
    const { result } = renderHook(() => useProductForm(), { wrapper })
    act(() => result.current.openCategoryManager())
    expect(result.current.isCategoryManagerOpen).toBe(true)
  })

  it('onSubmit calls createProduct when not editing', async () => {
    const { result } = renderHook(() => useProductForm(), { wrapper })

    await act(async () => {
      await result.current.onSubmit({
        name: 'New Item',
        category_id: 'cat-1',
        base_price: '10',
        base_cost: '5',
        avg_production_days: 2,
        is_active: true,
      })
    })

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalledOnce()
    })
    expect(updateMutateAsync).not.toHaveBeenCalled()
  })

  it('onSubmit converts empty category_id to undefined', async () => {
    const { result } = renderHook(() => useProductForm(), { wrapper })

    await act(async () => {
      await result.current.onSubmit({
        name: 'Item',
        category_id: '',
        base_price: '10',
        base_cost: '5',
        avg_production_days: null,
        is_active: true,
      })
    })

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ category_id: undefined }),
      )
    })
  })
})
