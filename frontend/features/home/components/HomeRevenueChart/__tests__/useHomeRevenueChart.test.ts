import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { createStore, Provider } from 'jotai'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CHART_MONTH_LABELS } from '@/features/home/constants/homeLabels'
import { useHomeRevenueChart } from '../useHomeRevenueChart'

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const store = createStore()
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(Provider, { store }, children)
    )
  }
  return TestWrapper
}

describe('useHomeRevenueChart', () => {
  it('isPending is true before data arrives', () => {
    const { result } = renderHook(() => useHomeRevenueChart(), {
      wrapper: makeWrapper(),
    })
    expect(result.current.isPending).toBe(true)
  })

  it('returns exactly 6 data points after data loads', async () => {
    const { result } = renderHook(() => useHomeRevenueChart(), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.chartData).toHaveLength(6)
  })

  it('each data point has a Hebrew month label', async () => {
    const { result } = renderHook(() => useHomeRevenueChart(), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isPending).toBe(false))

    for (const point of result.current.chartData) {
      expect(CHART_MONTH_LABELS).toContain(point.month)
    }
  })

  it('revenue and expenses are numbers, not strings', async () => {
    const { result } = renderHook(() => useHomeRevenueChart(), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isPending).toBe(false))

    for (const point of result.current.chartData) {
      expect(typeof point.revenue).toBe('number')
      expect(typeof point.expenses).toBe('number')
    }
  })

  it('hasData is true when any month has revenue > 0', async () => {
    const { result } = renderHook(() => useHomeRevenueChart(), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isPending).toBe(false))
    // MSW handler returns total_revenue: '5000' for all months
    expect(result.current.hasData).toBe(true)
  })
})
