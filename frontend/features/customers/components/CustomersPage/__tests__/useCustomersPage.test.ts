import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { createStore, Provider } from 'jotai'
import { useCustomersPage } from '../useCustomersPage'
import { isCustomerFormOpenAtom } from '../../../store/customersAtoms'

function makeWrapper(store: ReturnType<typeof createStore>) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(Provider, { store }, children)
  }
  return TestWrapper
}

describe('useCustomersPage', () => {
  it('onAdd opens the customer form', () => {
    const store = createStore()
    const { result } = renderHook(() => useCustomersPage(), { wrapper: makeWrapper(store) })

    act(() => {
      result.current.onAdd()
    })

    expect(store.get(isCustomerFormOpenAtom)).toBe(true)
  })
})
