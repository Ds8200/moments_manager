import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { createStore, Provider } from 'jotai'
import { useProductsFiltersBar } from '../useProductsFiltersBar'
import { productFiltersAtom } from '../../../store/productsAtoms'
import { PRODUCTS_LABELS } from '../../../constants/productsLabels'

function makeWrapper(store: ReturnType<typeof createStore>) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(Provider, { store }, children)
  }
  return TestWrapper
}

describe('useProductsFiltersBar', () => {
  it('exposes empty search by default', () => {
    const store = createStore()
    const { result } = renderHook(() => useProductsFiltersBar(), { wrapper: makeWrapper(store) })
    expect(result.current.searchValue).toBe('')
  })

  it('isActiveSelect has 3 options', () => {
    const store = createStore()
    const { result } = renderHook(() => useProductsFiltersBar(), { wrapper: makeWrapper(store) })
    expect(result.current.isActiveSelect.options).toHaveLength(3)
    expect(result.current.isActiveSelect.options[0].value).toBe('')
    expect(result.current.isActiveSelect.options[0].label).toBe(PRODUCTS_LABELS.ALL_STATUSES)
  })

  it('isActiveSelect value is empty string when is_active=null', () => {
    const store = createStore()
    const { result } = renderHook(() => useProductsFiltersBar(), { wrapper: makeWrapper(store) })
    expect(result.current.isActiveSelect.value).toBe('')
  })

  it('onSearchChange updates search and resets page to 1', () => {
    const store = createStore()
    const { result } = renderHook(() => useProductsFiltersBar(), { wrapper: makeWrapper(store) })

    act(() => {
      result.current.onSearchChange('חולצה')
    })

    expect(result.current.searchValue).toBe('חולצה')
    expect(store.get(productFiltersAtom).page).toBe(1)
  })

  it('isActiveSelect.onChange("true") sets is_active=true in atom', () => {
    const store = createStore()
    const { result } = renderHook(() => useProductsFiltersBar(), { wrapper: makeWrapper(store) })

    act(() => {
      result.current.isActiveSelect.onChange('true')
    })

    expect(store.get(productFiltersAtom).is_active).toBe(true)
  })

  it('isActiveSelect.onChange("false") sets is_active=false in atom', () => {
    const store = createStore()
    const { result } = renderHook(() => useProductsFiltersBar(), { wrapper: makeWrapper(store) })

    act(() => {
      result.current.isActiveSelect.onChange('false')
    })

    expect(store.get(productFiltersAtom).is_active).toBe(false)
  })

  it('isActiveSelect.onChange("") sets is_active=null in atom', () => {
    const store = createStore()
    store.set(productFiltersAtom, { search: '', is_active: true, page: 1, page_size: 20 })
    const { result } = renderHook(() => useProductsFiltersBar(), { wrapper: makeWrapper(store) })

    act(() => {
      result.current.isActiveSelect.onChange('')
    })

    expect(store.get(productFiltersAtom).is_active).toBeNull()
  })
})
