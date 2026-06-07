import React from 'react'
import { renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createStore, Provider } from 'jotai'
import { useSidebar } from '../useSidebar'
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

describe('useSidebar', () => {
  let store: ReturnType<typeof createStore>

  beforeEach(() => {
    store = createStore()
  })

  it('falls back to the generic logo and app name when no org branding is provided', () => {
    const { result } = renderHook(() => useSidebar({}), { wrapper: makeWrapper(store) })

    expect(result.current.logoSrc).toBe(UI_LABELS.GENERIC_LOGO_SRC)
    expect(result.current.logoAlt).toBe(UI_LABELS.APP_NAME)
  })

  it('falls back to the generic logo when logoUrl is null', () => {
    const { result } = renderHook(() => useSidebar({ logoUrl: null }), { wrapper: makeWrapper(store) })

    expect(result.current.logoSrc).toBe(UI_LABELS.GENERIC_LOGO_SRC)
  })

  it('uses the org logo URL and name when branding is provided', () => {
    const { result } = renderHook(
      () => useSidebar({ logoUrl: '/uploads/logos/org-1/logo.png', logoAlt: 'דפוס כהן' }),
      { wrapper: makeWrapper(store) },
    )

    expect(result.current.logoSrc).toBe('/uploads/logos/org-1/logo.png')
    expect(result.current.logoAlt).toBe('דפוס כהן')
  })
})
