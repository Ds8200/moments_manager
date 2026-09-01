import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRecordDetailHeader } from '../useRecordDetailHeader'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('useRecordDetailHeader', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  it('hides the menu button when there are no menu items', () => {
    const { result } = renderHook(() =>
      useRecordDetailHeader({
        title: 'דני', backLabel: 'חזרה', backHref: '/customers',
        menuTitle: 'דני', menuItems: [],
      })
    )
    expect(result.current.showMenuBtn).toBe(false)
  })

  it('shows the menu button when menu items are provided', () => {
    const { result } = renderHook(() =>
      useRecordDetailHeader({
        title: 'דני', backLabel: 'חזרה', backHref: '/customers',
        menuTitle: 'דני', menuItems: [{ label: 'מחיקה', onClick: vi.fn() }],
      })
    )
    expect(result.current.showMenuBtn).toBe(true)
  })

  it('onBack navigates to backHref', () => {
    const { result } = renderHook(() =>
      useRecordDetailHeader({
        title: 'דני', backLabel: 'חזרה', backHref: '/customers',
        menuTitle: 'דני', menuItems: [],
      })
    )

    act(() => result.current.onBack())

    expect(pushMock).toHaveBeenCalledWith('/customers')
  })

  it('onMenuBtnClick opens the dropdown with the given items', () => {
    const items = [{ label: 'מחיקה', onClick: vi.fn() }]
    const { result } = renderHook(() =>
      useRecordDetailHeader({
        title: 'דני', backLabel: 'חזרה', backHref: '/customers',
        menuTitle: 'דני', menuItems: items,
      })
    )
    const fakeEvent = { currentTarget: document.createElement('button') }

    act(() => result.current.onMenuBtnClick(fakeEvent as unknown as Parameters<typeof result.current.onMenuBtnClick>[0]))

    expect(result.current.menuState.isOpen).toBe(true)
    expect(result.current.menuState.items).toBe(items)
  })
})
