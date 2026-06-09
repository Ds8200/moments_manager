import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUserFormModal } from '../useUserFormModal'
import { isUserFormModalOpenAtom, pendingNewUserAtom } from '../../../../store/superAdminAtoms'

function makeWrapper(store: ReturnType<typeof createStore>, qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(
      QueryClientProvider,
      { client: qc },
      React.createElement(Provider, { store }, children)
    )
  }
  return TestWrapper
}

describe('useUserFormModal', () => {
  let store: ReturnType<typeof createStore>
  let qc: QueryClient

  beforeEach(() => {
    store = createStore()
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  it('isOpen reflects isUserFormModalOpenAtom', () => {
    const { result } = renderHook(() => useUserFormModal(), { wrapper: makeWrapper(store, qc) })
    expect(result.current.isOpen).toBe(false)
    act(() => store.set(isUserFormModalOpenAtom, true))
    expect(result.current.isOpen).toBe(true)
  })

  it('onClose sets isOpen to false and does not set pendingNewUser', () => {
    store.set(isUserFormModalOpenAtom, true)
    const { result } = renderHook(() => useUserFormModal(), { wrapper: makeWrapper(store, qc) })

    act(() => result.current.onClose())

    expect(result.current.isOpen).toBe(false)
    expect(store.get(pendingNewUserAtom)).toBeNull()
  })

  it('onSubmit with valid data writes to pendingNewUserAtom and closes modal', async () => {
    store.set(isUserFormModalOpenAtom, true)
    const { result } = renderHook(() => useUserFormModal(), { wrapper: makeWrapper(store, qc) })

    const form = result.current
    act(() => {
      const emailInput = { target: { value: 'new@test.com' } } as React.ChangeEvent<HTMLInputElement>
      form.register('email').onChange(emailInput)
    })

    await act(async () => {
      await form.onSubmit({
        preventDefault: () => undefined,
        currentTarget: null,
      } as unknown as React.BaseSyntheticEvent)
    })
  })

  it('registers required fields correctly', () => {
    const { result } = renderHook(() => useUserFormModal(), { wrapper: makeWrapper(store, qc) })
    const emailReg = result.current.register('email')
    const nameReg = result.current.register('full_name')
    const passReg = result.current.register('password')
    const phoneReg = result.current.register('phone')

    expect(emailReg.name).toBe('email')
    expect(nameReg.name).toBe('full_name')
    expect(passReg.name).toBe('password')
    expect(phoneReg.name).toBe('phone')
  })

  it('closeSymbol is the close UI symbol', () => {
    const { result } = renderHook(() => useUserFormModal(), { wrapper: makeWrapper(store, qc) })
    expect(typeof result.current.closeSymbol).toBe('string')
    expect(result.current.closeSymbol.length).toBeGreaterThan(0)
  })
})
