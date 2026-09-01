import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { createStore, Provider } from 'jotai'
import { useOrdersPage } from '../useOrdersPage'
import { isOrderFormOpenAtom } from '../../../store/ordersAtoms'

function makeWrapper(store: ReturnType<typeof createStore>) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(Provider, { store }, children)
  }
  return TestWrapper
}

describe('useOrdersPage', () => {
  it('onAdd opens the order form', () => {
    const store = createStore()
    const { result } = renderHook(() => useOrdersPage(), { wrapper: makeWrapper(store) })

    act(() => {
      result.current.onAdd()
    })

    expect(store.get(isOrderFormOpenAtom)).toBe(true)
  })
})
