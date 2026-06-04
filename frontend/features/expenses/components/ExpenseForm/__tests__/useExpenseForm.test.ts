import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { useExpenseForm } from '../useExpenseForm'

const createMutateAsync = vi.fn().mockResolvedValue({ id: 'new' })
const updateMutateAsync = vi.fn().mockResolvedValue({ id: 'existing' })

vi.mock('../../../queries/useExpenses', () => ({
  useCreateExpense: () => ({ mutateAsync: createMutateAsync }),
  useUpdateExpense: () => ({ mutateAsync: updateMutateAsync }),
}))

vi.mock('@/features/expenseCategories', () => ({
  useExpenseCategories: () => ({
    data: [{ id: 'ecat-1', name: 'דיו וצבעים', created_at: '', updated_at: '' }],
    isLoading: false,
  }),
  useCreateExpenseCategory: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteExpenseCategory: () => ({ mutateAsync: vi.fn() }),
}))

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client }, children)
}

describe('useExpenseForm', () => {
  beforeEach(() => {
    createMutateAsync.mockClear()
    updateMutateAsync.mockClear()
  })

  it('isOpen and isEditing are false initially', () => {
    const { result } = renderHook(() => useExpenseForm(), { wrapper })
    expect(result.current.isOpen).toBe(false)
    expect(result.current.isEditing).toBe(false)
  })

  it('exposes categories from DB query', () => {
    const { result } = renderHook(() => useExpenseForm(), { wrapper })
    expect(result.current.categories).toHaveLength(1)
    expect(result.current.categories[0].name).toBe('דיו וצבעים')
  })

  it('isCategoryManagerOpen is false initially', () => {
    const { result } = renderHook(() => useExpenseForm(), { wrapper })
    expect(result.current.isCategoryManagerOpen).toBe(false)
  })

  it('openCategoryManager sets isCategoryManagerOpen to true', async () => {
    const { result } = renderHook(() => useExpenseForm(), { wrapper })
    act(() => result.current.openCategoryManager())
    expect(result.current.isCategoryManagerOpen).toBe(true)
  })

  it('onSubmit calls createExpense when not editing', async () => {
    const { result } = renderHook(() => useExpenseForm(), { wrapper })

    await act(async () => {
      await result.current.onSubmit({
        date: '2025-03-01',
        category_id: 'ecat-1',
        amount: '25.00',
        notes: '',
      })
    })

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalledOnce()
    })
    expect(updateMutateAsync).not.toHaveBeenCalled()
  })

  it('onSubmit converts empty category_id to undefined', async () => {
    const { result } = renderHook(() => useExpenseForm(), { wrapper })

    await act(async () => {
      await result.current.onSubmit({
        date: '2025-03-01',
        category_id: '',
        amount: '10.00',
        notes: '',
      })
    })

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ category_id: undefined }),
      )
    })
  })
})
