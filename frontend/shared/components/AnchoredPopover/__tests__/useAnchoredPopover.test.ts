import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useAnchoredPopover } from '../useAnchoredPopover'
import type { AnchorEvent } from '../useAnchoredPopover'

function makeAnchorEvent(rect: Partial<DOMRect> = {}): AnchorEvent {
  const el = document.createElement('button')
  el.getBoundingClientRect = () =>
    ({
      left: 10,
      top: 20,
      width: 30,
      height: 40,
      right: 0,
      bottom: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
      ...rect,
    }) as DOMRect
  return { currentTarget: el }
}

describe('useAnchoredPopover', () => {
  it('starts closed', () => {
    const { result } = renderHook(() => useAnchoredPopover<string>())
    expect(result.current.state.isOpen).toBe(false)
  })

  it('open sets isOpen, data, and anchor coordinates from getBoundingClientRect', () => {
    const { result } = renderHook(() => useAnchoredPopover<{ id: string }>())

    act(() => {
      result.current.open({ id: 'order-1' }, makeAnchorEvent())
    })

    expect(result.current.state).toEqual({
      isOpen: true,
      data: { id: 'order-1' },
      anchorX: 10,
      anchorY: 20,
      anchorWidth: 30,
      anchorHeight: 40,
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

  it('open again with a different anchor replaces the previous data and coordinates', () => {
    const { result } = renderHook(() => useAnchoredPopover<string>())

    act(() => {
      result.current.open('first', makeAnchorEvent({ left: 10, top: 20 }))
    })
    act(() => {
      result.current.open('second', makeAnchorEvent({ left: 100, top: 200 }))
    })

    expect(result.current.state).toEqual({
      isOpen: true,
      data: 'second',
      anchorX: 100,
      anchorY: 200,
      anchorWidth: 30,
      anchorHeight: 40,
    })
  })
})
