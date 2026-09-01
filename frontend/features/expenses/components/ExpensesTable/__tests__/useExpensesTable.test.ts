import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useExpensesTable } from '../useExpensesTable'
import { expensesPageAtom, isExpenseFormOpenAtom, editingExpenseAtom } from '../../../store/expensesAtoms'
import { EXPENSES_LABELS } from '../../../constants/expensesLabels'
import type { ConfirmDialogOptions } from '@/shared/store/globalAtoms'

const confirmFn = vi.fn()
vi.mock('@/shared/hooks/useConfirm', () => ({ useConfirm: () => confirmFn }))

function makeWrapper(store: ReturnType<typeof createStore>, qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(
      QueryClientProvider,
      { client: qc },
      React.createElement(Provider, { store }, children),
    )
  }
  return TestWrapper
}

const EXPENSE_ROW = {
  id: 'e1',
  date: '2025-01-01',
  category_id: null,
  category: null,
  amount: '150.00',
  notes: 'דיו למדפסת',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

function makeContextMenuEvent() {
  return { preventDefault: vi.fn(), currentTarget: document.createElement('tr') }
}

describe('useExpensesTable', () => {
  let store: ReturnType<typeof createStore>
  let qc: QueryClient

  beforeEach(() => {
    store = createStore()
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    confirmFn.mockClear()
    server.use(
      http.get(API_ENDPOINTS.EXPENSES, () =>
        HttpResponse.json({ items: [EXPENSE_ROW], total: 1, page: 1, page_size: 20, pages: 1 })
      )
    )
  })

  it('returns expenses from the API', async () => {
    const { result } = renderHook(() => useExpensesTable(), { wrapper: makeWrapper(store, qc) })
    await vi.waitFor(() => expect(result.current.expenses).toHaveLength(1))
    expect(result.current.expenses[0].amount).toBe('150.00')
  })

  it('row onClick opens the edit modal for that expense', async () => {
    const { result } = renderHook(() => useExpensesTable(), { wrapper: makeWrapper(store, qc) })
    await vi.waitFor(() => expect(result.current.expenses).toHaveLength(1))

    act(() => { result.current.getRowProps(EXPENSE_ROW).onClick() })

    expect(store.get(editingExpenseAtom)).toEqual(EXPENSE_ROW)
    expect(store.get(isExpenseFormOpenAtom)).toBe(true)
  })

  it('right-click opens the menu with Edit and Delete', async () => {
    const { result } = renderHook(() => useExpensesTable(), { wrapper: makeWrapper(store, qc) })
    await vi.waitFor(() => expect(result.current.expenses).toHaveLength(1))
    const rowProps = result.current.getRowProps(EXPENSE_ROW)
    const event = makeContextMenuEvent()

    act(() => { rowProps.onContextMenu(event as unknown as Parameters<typeof rowProps.onContextMenu>[0]) })

    expect(result.current.menuState.isOpen).toBe(true)
    expect(result.current.menuState.items).toHaveLength(2)
  })

  it('delete menu item opens a confirm dialog', async () => {
    const { result } = renderHook(() => useExpensesTable(), { wrapper: makeWrapper(store, qc) })
    await vi.waitFor(() => expect(result.current.expenses).toHaveLength(1))
    const rowProps = result.current.getRowProps(EXPENSE_ROW)
    const event = makeContextMenuEvent()
    act(() => { rowProps.onContextMenu(event as unknown as Parameters<typeof rowProps.onContextMenu>[0]) })

    const deleteItem = result.current.menuState.items.find((i) => i.variant === 'danger')
    act(() => { deleteItem!.onClick() })

    expect(confirmFn).toHaveBeenCalledWith(
      expect.objectContaining<Partial<ConfirmDialogOptions>>({
        message: EXPENSES_LABELS.CONFIRM_DELETE,
        isDangerous: true,
      })
    )
  })

  it('onPageChange updates expensesPageAtom', async () => {
    const { result } = renderHook(() => useExpensesTable(), { wrapper: makeWrapper(store, qc) })
    await vi.waitFor(() => expect(result.current.expenses).toHaveLength(1))

    act(() => { result.current.onPageChange(2) })

    expect(store.get(expensesPageAtom)).toBe(2)
  })

  it('formatAmount formats a numeric string as currency', () => {
    const { result } = renderHook(() => useExpensesTable(), { wrapper: makeWrapper(store, qc) })
    expect(result.current.formatAmount('150')).toContain('150')
  })
})
