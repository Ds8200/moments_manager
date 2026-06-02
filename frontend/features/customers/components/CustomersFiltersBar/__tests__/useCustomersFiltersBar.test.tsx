import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { createStore, Provider } from 'jotai'
import { useCustomersFiltersBar } from '../useCustomersFiltersBar'
import { customerFiltersAtom, isCustomerFormOpenAtom, editingCustomerIdAtom } from '../../../store/customersAtoms'
import { CUSTOMERS_LABELS } from '../../../constants/customersLabels'

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

  it('onNew opens the form and clears editingId', () => {
    const store = createStore()
    const { result } = renderHook(() => useCustomersFiltersBar(), { wrapper: makeWrapper(store) })

    act(() => {
      result.current.onNew()
    })

    expect(store.get(isCustomerFormOpenAtom)).toBe(true)
    expect(store.get(editingCustomerIdAtom)).toBeNull()
  })

  it('exposes the new button label from constants', () => {
    const store = createStore()
    const { result } = renderHook(() => useCustomersFiltersBar(), { wrapper: makeWrapper(store) })
    expect(result.current.newButtonLabel).toBe(CUSTOMERS_LABELS.NEW_CUSTOMER)
  })
})
