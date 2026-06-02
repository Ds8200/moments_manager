import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { createStore, Provider } from 'jotai'
import { useNotify } from '../useNotify'
import { toastsAtom } from '../../store/globalAtoms'
import { NOTIFICATION_TYPE } from '../../enums/notificationEnums'

const makeWrapper = (store: ReturnType<typeof createStore>) => {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(Provider, { store }, children)
  }
  return TestWrapper
}

describe('useNotify', () => {
  it('success adds a success toast', () => {
    const store = createStore()
    const { result } = renderHook(() => useNotify(), { wrapper: makeWrapper(store) })

    act(() => result.current.success('done'))

    const toasts = store.get(toastsAtom)
    expect(toasts).toHaveLength(1)
    expect(toasts[0]).toMatchObject({ type: NOTIFICATION_TYPE.SUCCESS, message: 'done' })
  })

  it('error, info and warning add toasts of the matching type', () => {
    const store = createStore()
    const { result } = renderHook(() => useNotify(), { wrapper: makeWrapper(store) })

    act(() => {
      result.current.error('e')
      result.current.info('i')
      result.current.warning('w')
    })

    expect(store.get(toastsAtom).map((t) => t.type)).toEqual([
      NOTIFICATION_TYPE.ERROR,
      NOTIFICATION_TYPE.INFO,
      NOTIFICATION_TYPE.WARNING,
    ])
  })
})
