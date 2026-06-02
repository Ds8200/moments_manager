import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUserForm } from '../useUserForm'
import { isUserFormOpenAtom } from '../../../store/usersAtoms'
import { ApiError } from '@/shared/utils/apiClient'

const createMutateAsync = vi.fn().mockResolvedValue({ id: 'new' })

vi.mock('../../../queries/useUsers', () => ({
  useCreateUser: () => ({ mutateAsync: createMutateAsync }),
}))

function makeWrapper(store: ReturnType<typeof createStore>, qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(
      QueryClientProvider,
      { client: qc },
      React.createElement(Provider, { store }, children),
    )
  }
  return TestWrapper
}

describe('useUserForm', () => {
  let store: ReturnType<typeof createStore>
  let qc: QueryClient

  beforeEach(() => {
    store = createStore()
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    createMutateAsync.mockClear()
  })

  it('isOpen is false initially', () => {
    const { result } = renderHook(() => useUserForm(), { wrapper: makeWrapper(store, qc) })
    expect(result.current.isOpen).toBe(false)
  })

  it('onSubmit calls createUser with the submitted values', async () => {
    const { result } = renderHook(() => useUserForm(), { wrapper: makeWrapper(store, qc) })

    await act(async () => {
      await result.current.onSubmit({
        email: 'new@example.com',
        full_name: 'New User',
        role: 'admin',
      })
    })

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalledWith({
        email: 'new@example.com',
        full_name: 'New User',
        role: 'admin',
      })
    })
  })

  it('onSubmit closes the form on success', async () => {
    store.set(isUserFormOpenAtom, true)
    const { result } = renderHook(() => useUserForm(), { wrapper: makeWrapper(store, qc) })

    await act(async () => {
      await result.current.onSubmit({
        email: 'new@example.com',
        full_name: 'New User',
        role: 'user',
      })
    })

    expect(store.get(isUserFormOpenAtom)).toBe(false)
  })

  it('onClose closes the form', () => {
    store.set(isUserFormOpenAtom, true)
    const { result } = renderHook(() => useUserForm(), { wrapper: makeWrapper(store, qc) })

    act(() => {
      result.current.onClose()
    })

    expect(store.get(isUserFormOpenAtom)).toBe(false)
  })

  it('keeps the form open when the mutation fails (error shown globally)', async () => {
    createMutateAsync.mockRejectedValueOnce(new ApiError(409, 'exists', 'USER_EMAIL_EXISTS'))
    store.set(isUserFormOpenAtom, true)
    const { result } = renderHook(() => useUserForm(), { wrapper: makeWrapper(store, qc) })

    await act(async () => {
      await result.current.onSubmit({
        email: 'dup@example.com',
        full_name: 'Dup',
        role: 'user',
      })
    })

    expect(store.get(isUserFormOpenAtom)).toBe(true)
  })

  it('does not reject from onSubmit on a non-409 error', async () => {
    createMutateAsync.mockRejectedValueOnce(new ApiError(500, 'boom'))
    store.set(isUserFormOpenAtom, true)
    const { result } = renderHook(() => useUserForm(), { wrapper: makeWrapper(store, qc) })

    await expect(
      act(async () => {
        await result.current.onSubmit({
          email: 'x@example.com',
          full_name: 'X',
          role: 'user',
        })
      })
    ).resolves.toBeUndefined()

    expect(store.get(isUserFormOpenAtom)).toBe(true)
  })
})
