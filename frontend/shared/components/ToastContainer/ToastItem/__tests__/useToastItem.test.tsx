import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { useToastItem } from '../useToastItem'
import { addToastAtom, toastsAtom } from '@/shared/store/globalAtoms'
import { NOTIFICATION_TYPE } from '@/shared/enums/notificationEnums'
import type { Toast } from '@/shared/store/globalAtoms'

const makeWrapper = (store: ReturnType<typeof createStore>) => {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(Provider, { store }, children)
  }
  return TestWrapper
}

const seedToast = (store: ReturnType<typeof createStore>, partial: Partial<Toast>): Toast => {
  store.set(addToastAtom, {
    type: partial.type ?? NOTIFICATION_TYPE.INFO,
    message: partial.message ?? 'msg',
    duration: partial.duration,
  })
  return store.get(toastsAtom)[0]
}

describe('useToastItem', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('uses role="alert" for errors and "status" otherwise', () => {
    const store = createStore()
    const errorToast = seedToast(store, { type: NOTIFICATION_TYPE.ERROR })
    const { result } = renderHook(() => useToastItem({ toast: errorToast }), {
      wrapper: makeWrapper(store),
    })
    expect(result.current.ariaRole).toBe('alert')

    const store2 = createStore()
    const okToast = seedToast(store2, { type: NOTIFICATION_TYPE.SUCCESS })
    const { result: result2 } = renderHook(() => useToastItem({ toast: okToast }), {
      wrapper: makeWrapper(store2),
    })
    expect(result2.current.ariaRole).toBe('status')
  })

  it('auto-dismisses the toast after its duration', () => {
    const store = createStore()
    const toast = seedToast(store, { duration: 1000 })
    renderHook(() => useToastItem({ toast }), { wrapper: makeWrapper(store) })

    expect(store.get(toastsAtom)).toHaveLength(1)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(store.get(toastsAtom)).toHaveLength(0)
  })

  it('onClose removes the toast immediately', () => {
    const store = createStore()
    const toast = seedToast(store, {})
    const { result } = renderHook(() => useToastItem({ toast }), { wrapper: makeWrapper(store) })

    act(() => result.current.onClose())
    expect(store.get(toastsAtom)).toHaveLength(0)
  })
})
