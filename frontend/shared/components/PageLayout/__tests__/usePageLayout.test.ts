import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { usePageLayout } from '../usePageLayout'

describe('usePageLayout', () => {
  it('passes through the title', () => {
    const { result } = renderHook(() =>
      usePageLayout({ title: 'משתמשים', children: null })
    )
    expect(result.current.title).toBe('משתמשים')
  })

  it('showAction is false when neither actionLabel nor onAction is given', () => {
    const { result } = renderHook(() =>
      usePageLayout({ title: 'משתמשים', children: null })
    )
    expect(result.current.showAction).toBe(false)
  })

  it('showAction is false when only actionLabel is given (no handler)', () => {
    const { result } = renderHook(() =>
      usePageLayout({ title: 'משתמשים', actionLabel: '+ חדש', children: null })
    )
    expect(result.current.showAction).toBe(false)
  })

  it('showAction is true when both actionLabel and onAction are given', () => {
    const { result } = renderHook(() =>
      usePageLayout({ title: 'משתמשים', actionLabel: '+ חדש', onAction: vi.fn(), children: null })
    )
    expect(result.current.showAction).toBe(true)
    expect(result.current.actionLabel).toBe('+ חדש')
  })

  it('onAction calls the provided handler', () => {
    const onAction = vi.fn()
    const { result } = renderHook(() =>
      usePageLayout({ title: 'משתמשים', actionLabel: '+ חדש', onAction, children: null })
    )

    result.current.onAction()

    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('does not throw when onAction is called without a handler provided', () => {
    const { result } = renderHook(() =>
      usePageLayout({ title: 'משתמשים', children: null })
    )
    expect(() => result.current.onAction()).not.toThrow()
  })

  it('passes through filters and children', () => {
    const filters = 'filters-node'
    const children = 'children-node'
    const { result } = renderHook(() =>
      usePageLayout({ title: 'משתמשים', filters, children })
    )
    expect(result.current.filters).toBe(filters)
    expect(result.current.children).toBe(children)
  })

  it('passes through actions', () => {
    const actions = 'actions-node'
    const { result } = renderHook(() =>
      usePageLayout({ title: 'דוחות', actions, children: null })
    )
    expect(result.current.actions).toBe(actions)
  })

  it('scrollContent defaults to false', () => {
    const { result } = renderHook(() =>
      usePageLayout({ title: 'משתמשים', children: null })
    )
    expect(result.current.scrollContent).toBe(false)
  })

  it('scrollContent passes through true', () => {
    const { result } = renderHook(() =>
      usePageLayout({ title: 'דוחות', scrollContent: true, children: null })
    )
    expect(result.current.scrollContent).toBe(true)
  })
})
