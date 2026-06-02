import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { useConfirmDialog } from '../useConfirmDialog'
import { confirmDialogAtom } from '@/shared/store/globalAtoms'
import { CONFIRM_DIALOG_LABELS } from '@/shared/constants/uiLabels'

function makeWrapper(store: ReturnType<typeof createStore>) {
  function TestWrapper({ children }: { children: ReactNode }): ReturnType<typeof createElement> {
    return createElement(Provider, { store }, children)
  }
  return TestWrapper
}

describe('useConfirmDialog', () => {
  let store: ReturnType<typeof createStore>

  beforeEach(() => {
    store = createStore()
  })

  it('returns isOpen: false by default', () => {
    const { result } = renderHook(() => useConfirmDialog(), { wrapper: makeWrapper(store) })
    expect(result.current.isOpen).toBe(false)
  })

  it('returns default title from labels when no title provided', () => {
    store.set(confirmDialogAtom, {
      isOpen: true,
      options: { message: 'הודעה', onConfirm: vi.fn() },
    })
    const { result } = renderHook(() => useConfirmDialog(), { wrapper: makeWrapper(store) })
    expect(result.current.title).toBe(CONFIRM_DIALOG_LABELS.TITLE)
  })

  it('returns custom title when provided', () => {
    store.set(confirmDialogAtom, {
      isOpen: true,
      options: { title: 'כותרת מותאמת', message: 'הודעה', onConfirm: vi.fn() },
    })
    const { result } = renderHook(() => useConfirmDialog(), { wrapper: makeWrapper(store) })
    expect(result.current.title).toBe('כותרת מותאמת')
  })

  it('exposes message and isDangerous from atom options', () => {
    store.set(confirmDialogAtom, {
      isOpen: true,
      options: { message: 'האם למחוק?', isDangerous: true, onConfirm: vi.fn() },
    })
    const { result } = renderHook(() => useConfirmDialog(), { wrapper: makeWrapper(store) })
    expect(result.current.message).toBe('האם למחוק?')
    expect(result.current.isDangerous).toBe(true)
  })

  it('isDangerous defaults to false when not specified', () => {
    store.set(confirmDialogAtom, {
      isOpen: true,
      options: { message: 'הודעה', onConfirm: vi.fn() },
    })
    const { result } = renderHook(() => useConfirmDialog(), { wrapper: makeWrapper(store) })
    expect(result.current.isDangerous).toBe(false)
  })

  it('onConfirm calls the callback and closes the dialog', () => {
    const callback = vi.fn()
    store.set(confirmDialogAtom, {
      isOpen: true,
      options: { message: 'בטוח?', onConfirm: callback },
    })
    const { result } = renderHook(() => useConfirmDialog(), { wrapper: makeWrapper(store) })

    act(() => { result.current.onConfirm() })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(result.current.isOpen).toBe(false)
  })

  it('onCancel closes the dialog without calling the callback', () => {
    const callback = vi.fn()
    store.set(confirmDialogAtom, {
      isOpen: true,
      options: { message: 'בטוח?', onConfirm: callback },
    })
    const { result } = renderHook(() => useConfirmDialog(), { wrapper: makeWrapper(store) })

    act(() => { result.current.onCancel() })

    expect(callback).not.toHaveBeenCalled()
    expect(result.current.isOpen).toBe(false)
  })

  it('exposes correct button labels from constants', () => {
    const { result } = renderHook(() => useConfirmDialog(), { wrapper: makeWrapper(store) })
    expect(result.current.confirmLabel).toBe(CONFIRM_DIALOG_LABELS.CONFIRM)
    expect(result.current.cancelLabel).toBe(CONFIRM_DIALOG_LABELS.CANCEL)
  })
})
