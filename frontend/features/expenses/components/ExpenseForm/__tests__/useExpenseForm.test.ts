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

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client }, children)
}

describe('useExpenseForm', () => {
  beforeEach(() => {
    createMutateAsync.mockClear()
    updateMutateAsync.mockClear()
  })

  it('exposes the predefined expense categories', () => {
    const { result } = renderHook(() => useExpenseForm(), { wrapper })
    expect(result.current.categories).toEqual([
      'ink',
      'materials',
      'equipment',
      'shipping',
      'utilities',
      'other',
    ])
  })

  it('isOpen and isEditing are false initially', () => {
    const { result } = renderHook(() => useExpenseForm(), { wrapper })
    expect(result.current.isOpen).toBe(false)
    expect(result.current.isEditing).toBe(false)
  })

  it('onSubmit calls createExpense when not editing', async () => {
    const { result } = renderHook(() => useExpenseForm(), { wrapper })

    await act(async () => {
      await result.current.onSubmit({
        date: '2025-03-01',
        category: 'ink',
        amount: '25.00',
        notes: '',
      })
    })

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalledOnce()
    })
    expect(updateMutateAsync).not.toHaveBeenCalled()
  })
})
