import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useAnchoredPopover } from '../useAnchoredPopover'
import type { AnchorEvent } from '../useAnchoredPopover'

function makeAnchorEvent(): AnchorEvent {
  return { currentTarget: document.createElement('button') }
}

describe('useAnchoredPopover', () => {
  it('starts closed', () => {
    const { result } = renderHook(() => useAnchoredPopover<string>())
    expect(result.current.state.isOpen).toBe(false)
  })

  it('open sets isOpen, data, and the anchor element', () => {
    const { result } = renderHook(() => useAnchoredPopover<{ id: string }>())
    const event = makeAnchorEvent()

    act(() => {
      result.current.open({ id: 'order-1' }, event)
    })

    expect(result.current.state).toEqual({
      isOpen: true,
      data: { id: 'order-1' },
      anchorEl: event.currentTarget,
    })
  })

  it('close resets to the closed state', () => {
    const { result } = renderHook(() => useAnchoredPopover<string>())

    act(() => {
      result.current.open('payload', makeAnchorEvent())
    })
    act(() => {
      result.current.close()
    })

    expect(result.current.state).toEqual({ isOpen: false })
  })

  it('open again with a different anchor replaces the previous data and anchor element', () => {
    const { result } = renderHook(() => useAnchoredPopover<string>())
    const secondEvent = makeAnchorEvent()

    act(() => {
      result.current.open('first', makeAnchorEvent())
    })
    act(() => {
      result.current.open('second', secondEvent)
    })

    expect(result.current.state).toEqual({
      isOpen: true,
      data: 'second',
      anchorEl: secondEvent.currentTarget,
    })
  })
})
