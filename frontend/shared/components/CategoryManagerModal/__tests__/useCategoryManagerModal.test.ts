import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { useCategoryManagerModal } from '../useCategoryManagerModal'
import { ApiError } from '@/shared/utils/apiClient'

const createFn = vi.fn().mockResolvedValue({ id: 'cat-new', name: 'חדש' })
const deleteFn = vi.fn().mockResolvedValue(undefined)
const onClose   = vi.fn()

const LABELS = {
  title: 'ניהול קטגוריות',
  addPlaceholder: 'שם',
  addBtn: 'הוסף',
  empty: 'אין',
  deleteTitle: 'מחק',
}

const BASE_OPTIONS = {
  categories: [
    { id: 'cat-1', name: 'הדפסה' },
    { id: 'cat-2', name: 'ציוד' },
  ],
  isLoading: false,
  onCreate: createFn,
  onDelete: deleteFn,
  isCreating: false,
  inUseErrorCode: 'CATEGORY_IN_USE',
  inUseErrorMessage: 'הקטגוריה בשימוש',
  onClose,
  labels: LABELS,
}

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client }, children)
}

describe('useCategoryManagerModal', () => {
  beforeEach(() => {
    createFn.mockClear()
    deleteFn.mockClear()
    onClose.mockClear()
  })

  it('returns categories from options', () => {
    const { result } = renderHook(() => useCategoryManagerModal(BASE_OPTIONS), { wrapper })
    expect(result.current.categories).toHaveLength(2)
  })

  it('onAdd calls onCreate and resets form', async () => {
    const { result } = renderHook(() => useCategoryManagerModal(BASE_OPTIONS), { wrapper })
    await act(async () => {
      await result.current.onAdd({ name: 'חדש' })
    })
    expect(createFn).toHaveBeenCalledWith('חדש')
  })

  it('onDelete calls deleteFn', async () => {
    const { result } = renderHook(() => useCategoryManagerModal(BASE_OPTIONS), { wrapper })
    await act(async () => {
      await result.current.onDelete('cat-1')
    })
    expect(deleteFn).toHaveBeenCalledWith('cat-1')
  })

  it('onDelete sets inUseErrorMessage when CATEGORY_IN_USE error thrown', async () => {
    deleteFn.mockRejectedValueOnce(new ApiError(409, 'in use', 'CATEGORY_IN_USE'))
    const { result } = renderHook(() => useCategoryManagerModal(BASE_OPTIONS), { wrapper })

    await act(async () => {
      await result.current.onDelete('cat-1')
    })

    await waitFor(() => {
      expect(result.current.deleteErrors['cat-1']).toBe('הקטגוריה בשימוש')
    })
  })

  it('does not set error for other error codes', async () => {
    deleteFn.mockRejectedValueOnce(new ApiError(500, 'server error', 'INTERNAL_ERROR'))
    const { result } = renderHook(() => useCategoryManagerModal(BASE_OPTIONS), { wrapper })

    await act(async () => {
      await result.current.onDelete('cat-1')
    })

    expect(result.current.deleteErrors['cat-1']).toBe('')
  })
})
