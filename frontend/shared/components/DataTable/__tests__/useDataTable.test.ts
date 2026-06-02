import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useDataTable } from '../useDataTable'
import type { DataTableProps } from '../useDataTable'

type Row = { id: string; name: string }

const LABELS = { totalPrefix: 'סה"כ', totalSuffix: 'פריטים', prev: 'הקודם', next: 'הבא' }

const buildProps = (overrides: Partial<DataTableProps<Row>> = {}): DataTableProps<Row> => ({
  headers: ['שם'],
  rows: [],
  keyExtractor: (r) => r.id,
  renderRow: vi.fn(),
  isLoading: false,
  isError: false,
  emptyTitle: 'ריק',
  emptyDescription: '',
  emptyIcon: '📭',
  errorTitle: 'שגיאה',
  currentPage: 1,
  totalPages: 1,
  total: 0,
  onPageChange: vi.fn(),
  paginationLabels: LABELS,
  ...overrides,
})

describe('useDataTable', () => {
  it('shows loading state when isLoading=true', () => {
    const { result } = renderHook(() => useDataTable(buildProps({ isLoading: true })))
    expect(result.current.showLoading).toBe(true)
    expect(result.current.showError).toBe(false)
    expect(result.current.showEmpty).toBe(false)
    expect(result.current.showTable).toBe(false)
  })

  it('shows error state when isError=true and not loading', () => {
    const { result } = renderHook(() => useDataTable(buildProps({ isError: true })))
    expect(result.current.showError).toBe(true)
    expect(result.current.showLoading).toBe(false)
    expect(result.current.showEmpty).toBe(false)
    expect(result.current.showTable).toBe(false)
  })

  it('shows empty state when no rows and not loading/error', () => {
    const { result } = renderHook(() => useDataTable(buildProps({ rows: [] })))
    expect(result.current.showEmpty).toBe(true)
    expect(result.current.showTable).toBe(false)
  })

  it('shows table when rows present and no loading/error', () => {
    const rows: Row[] = [{ id: '1', name: 'א' }]
    const { result } = renderHook(() => useDataTable(buildProps({ rows })))
    expect(result.current.showTable).toBe(true)
    expect(result.current.showEmpty).toBe(false)
  })

  it('does not show pagination when totalPages <= 1', () => {
    const rows: Row[] = [{ id: '1', name: 'א' }]
    const { result } = renderHook(() => useDataTable(buildProps({ rows, totalPages: 1 })))
    expect(result.current.showPagination).toBe(false)
  })

  it('shows pagination when showTable and totalPages > 1', () => {
    const rows: Row[] = [{ id: '1', name: 'א' }]
    const { result } = renderHook(() => useDataTable(buildProps({ rows, totalPages: 3 })))
    expect(result.current.showPagination).toBe(true)
  })

  it('disables prev when currentPage=1', () => {
    const rows: Row[] = [{ id: '1', name: 'א' }]
    const { result } = renderHook(() => useDataTable(buildProps({ rows, currentPage: 1, totalPages: 3 })))
    expect(result.current.isPrevDisabled).toBe(true)
    expect(result.current.isNextDisabled).toBe(false)
  })

  it('disables next when currentPage=totalPages', () => {
    const rows: Row[] = [{ id: '1', name: 'א' }]
    const { result } = renderHook(() => useDataTable(buildProps({ rows, currentPage: 3, totalPages: 3 })))
    expect(result.current.isNextDisabled).toBe(true)
    expect(result.current.isPrevDisabled).toBe(false)
  })

  it('enables both buttons on a middle page', () => {
    const rows: Row[] = [{ id: '1', name: 'א' }]
    const { result } = renderHook(() => useDataTable(buildProps({ rows, currentPage: 2, totalPages: 3 })))
    expect(result.current.isPrevDisabled).toBe(false)
    expect(result.current.isNextDisabled).toBe(false)
  })

  it('passes through paginationLabels', () => {
    const { result } = renderHook(() => useDataTable(buildProps()))
    expect(result.current.paginationLabels).toEqual(LABELS)
  })
})
