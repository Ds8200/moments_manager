import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createStore, Provider } from 'jotai'
import { useMobileDrawer } from '../useMobileDrawer'
import { isSidebarOpenAtom } from '@/shared/store/globalAtoms'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import { ROUTES } from '@/shared/constants/routes'

vi.mock('next/navigation', () => ({
  usePathname: () => ROUTES.HOME,
}))

vi.mock('@/shared/hooks/useAssistantName', () => ({
  useAssistantName: () => 'Test AI',
}))

function makeWrapper(store: ReturnType<typeof createStore>) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(Provider, { store }, children)
  }
  return TestWrapper
}

describe('useMobileDrawer', () => {
  let store: ReturnType<typeof createStore>

  beforeEach(() => {
    store = createStore()
  })

  it('falls back to the generic logo and app name when no org branding is provided', () => {
    const { result } = renderHook(() => useMobileDrawer({}), { wrapper: makeWrapper(store) })

    expect(result.current.logoSrc).toBe(UI_LABELS.GENERIC_LOGO_SRC)
    expect(result.current.logoAlt).toBe(UI_LABELS.APP_NAME)
  })

  it('uses the org logo URL and name when branding is provided', () => {
    const { result } = renderHook(
      () => useMobileDrawer({ logoUrl: '/uploads/logos/org-1/logo.png', logoAlt: 'דפוס כהן' }),
      { wrapper: makeWrapper(store) },
    )

    expect(result.current.logoSrc).toBe('/uploads/logos/org-1/logo.png')
    expect(result.current.logoAlt).toBe('דפוס כהן')
  })

  it('closes the drawer via onClose', () => {
    store.set(isSidebarOpenAtom, true)
    const { result } = renderHook(() => useMobileDrawer({}), { wrapper: makeWrapper(store) })

    expect(result.current.isOpen).toBe(true)
    act(() => result.current.onClose())
    expect(result.current.isOpen).toBe(false)
  })
})
