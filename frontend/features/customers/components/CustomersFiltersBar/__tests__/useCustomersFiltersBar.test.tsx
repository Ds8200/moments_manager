import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { createStore, Provider } from 'jotai'
import { useCustomersFiltersBar } from '../useCustomersFiltersBar'
import { customerFiltersAtom } from '../../../store/customersAtoms'

function makeWrapper(store: ReturnType<typeof createStore>) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(Provider, { store }, children)
  }
  return TestWrapper
}

describe('useCustomersFiltersBar', () => {
  it('exposes empty search by default', () => {
    const store = createStore()
    const { result } = renderHook(() => useCustomersFiltersBar(), { wrapper: makeWrapper(store) })
    expect(result.current.searchValue).toBe('')
  })

  it('onSearchChange updates search and resets page to 1', () => {
    const store = createStore()
    const { result } = renderHook(() => useCustomersFiltersBar(), { wrapper: makeWrapper(store) })

    act(() => {
      result.current.onSearchChange('דניאל')
    })

    expect(result.current.searchValue).toBe('דניאל')
    expect(store.get(customerFiltersAtom).page).toBe(1)
  })
})
