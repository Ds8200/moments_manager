import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { createStore, Provider } from 'jotai'
import { useProductsPage } from '../useProductsPage'
import { isProductFormOpenAtom } from '../../../store/productsAtoms'

function makeWrapper(store: ReturnType<typeof createStore>) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(Provider, { store }, children)
  }
  return TestWrapper
}

describe('useProductsPage', () => {
  it('onAdd opens the product form', () => {
    const store = createStore()
    const { result } = renderHook(() => useProductsPage(), { wrapper: makeWrapper(store) })

    act(() => {
      result.current.onAdd()
    })

    expect(store.get(isProductFormOpenAtom)).toBe(true)
  })
})
