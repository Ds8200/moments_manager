import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { useCategoryManagerModal } from '../useCategoryManagerModal'
import { ApiError } from '@/shared/utils/apiClient'

const createMutateAsync = vi.fn().mockResolvedValue({ id: 'cat-new', name: 'חדש' })
const deleteMutateAsync = vi.fn().mockResolvedValue(undefined)

vi.mock('@/features/productCategories', () => ({
  useProductCategories: () => ({
    data: [
      { id: 'cat-1', name: 'הדפסה', created_at: '', updated_at: '' },
      { id: 'cat-2', name: 'כרטיסים', created_at: '', updated_at: '' },
    ],
    isLoading: false,
  }),
  useCreateProductCategory: () => ({ mutateAsync: createMutateAsync, isPending: false }),
  useDeleteProductCategory: () => ({ mutateAsync: deleteMutateAsync }),
}))

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client }, children)
}

const onClose = vi.fn()

describe('useCategoryManagerModal', () => {
  beforeEach(() => {
    createMutateAsync.mockClear()
    deleteMutateAsync.mockClear()
    onClose.mockClear()
  })

  it('returns categories from query', () => {
    const { result } = renderHook(() => useCategoryManagerModal({ onClose }), { wrapper })
    expect(result.current.categories).toHaveLength(2)
  })

  it('onAdd calls create mutation and resets form', async () => {
    const { result } = renderHook(() => useCategoryManagerModal({ onClose }), { wrapper })
    await act(async () => {
      await result.current.onAdd({ name: 'חדש' })
    })
    expect(createMutateAsync).toHaveBeenCalledWith('חדש')
  })

  it('onDelete calls delete mutation', async () => {
    const { result } = renderHook(() => useCategoryManagerModal({ onClose }), { wrapper })
    await act(async () => {
      await result.current.onDelete('cat-1')
    })
    expect(deleteMutateAsync).toHaveBeenCalledWith('cat-1')
  })

  it('onDelete sets CATEGORY_IN_USE error when 409 returned', async () => {
    deleteMutateAsync.mockRejectedValueOnce(new ApiError(409, 'in use', 'CATEGORY_IN_USE'))
    const { result } = renderHook(() => useCategoryManagerModal({ onClose }), { wrapper })

    await act(async () => {
      await result.current.onDelete('cat-1')
    })

    await waitFor(() => {
      expect(result.current.deleteErrors['cat-1']).toBeTruthy()
    })
  })
})
