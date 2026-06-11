import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useBrandThemeApplier } from '../useBrandThemeApplier'
import { DEFAULT_BRAND_COLORS } from '@/shared/utils/branding'

const ORG_BRAND_COLORS = {
  primary: '#3B5BDB',
  secondary: '#7048E8',
  accent: '#F03E3E',
  background: '#FFFFFF',
  text: '#212529',
}

const ORG_RESPONSE = {
  id: 'org1',
  slug: 'cohen-print',
  name: 'דפוס כהן',
  logo_path: 'uploads/logos/org1/logo.png',
  brand_colors: ORG_BRAND_COLORS,
  plan: 'trial',
  trial_ends_at: null,
  is_active: true,
  max_users: 2,
  owner_id: 'user1',
  created_at: '2026-06-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
}

function makeWrapper(qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: qc }, children)
  }
  return TestWrapper
}

const getCssVar = (name: string): string => document.documentElement.style.getPropertyValue(name)

describe('useBrandThemeApplier', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    ;['--color-primary', '--color-secondary', '--color-accent', '--color-bg', '--color-text'].forEach((name) =>
      document.documentElement.style.removeProperty(name),
    )
  })

  it('applies the initial colors to the document root immediately', () => {
    server.use(http.get(API_ENDPOINTS.ORGS_ME, () => HttpResponse.json({ ...ORG_RESPONSE, brand_colors: null })))

    renderHook(() => useBrandThemeApplier({ initialColors: DEFAULT_BRAND_COLORS }), { wrapper: makeWrapper(qc) })

    expect(getCssVar('--color-primary')).toBe(DEFAULT_BRAND_COLORS.primary)
    expect(getCssVar('--color-secondary')).toBe(DEFAULT_BRAND_COLORS.secondary)
    expect(getCssVar('--color-accent')).toBe(DEFAULT_BRAND_COLORS.accent)
    expect(getCssVar('--color-bg')).toBe(DEFAULT_BRAND_COLORS.background)
    expect(getCssVar('--color-text')).toBe(DEFAULT_BRAND_COLORS.text)
  })

  it('switches to the live org brand colors once useMyOrg loads', async () => {
    server.use(http.get(API_ENDPOINTS.ORGS_ME, () => HttpResponse.json(ORG_RESPONSE)))

    const { result } = renderHook(() => useBrandThemeApplier({ initialColors: DEFAULT_BRAND_COLORS }), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.colors).toEqual(ORG_BRAND_COLORS))
    await waitFor(() => expect(getCssVar('--color-primary')).toBe(ORG_BRAND_COLORS.primary))
    expect(getCssVar('--color-secondary')).toBe(ORG_BRAND_COLORS.secondary)
    expect(getCssVar('--color-accent')).toBe(ORG_BRAND_COLORS.accent)
    expect(getCssVar('--color-bg')).toBe(ORG_BRAND_COLORS.background)
    expect(getCssVar('--color-text')).toBe(ORG_BRAND_COLORS.text)
  })

  it('falls back to the initial colors when the org has no brand colors', async () => {
    server.use(http.get(API_ENDPOINTS.ORGS_ME, () => HttpResponse.json({ ...ORG_RESPONSE, brand_colors: null })))

    const { result } = renderHook(() => useBrandThemeApplier({ initialColors: DEFAULT_BRAND_COLORS }), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(result.current.colors).toEqual(DEFAULT_BRAND_COLORS))
    expect(getCssVar('--color-primary')).toBe(DEFAULT_BRAND_COLORS.primary)
  })

  it('re-applies fresh colors when the org query is invalidated after a logo upload', async () => {
    const NEW_COLORS = { ...ORG_BRAND_COLORS, primary: '#22B8CF' }
    let callCount = 0
    server.use(
      http.get(API_ENDPOINTS.ORGS_ME, () => {
        callCount += 1
        return HttpResponse.json({ ...ORG_RESPONSE, brand_colors: callCount === 1 ? ORG_BRAND_COLORS : NEW_COLORS })
      }),
    )

    const { result } = renderHook(() => useBrandThemeApplier({ initialColors: DEFAULT_BRAND_COLORS }), {
      wrapper: makeWrapper(qc),
    })

    await waitFor(() => expect(getCssVar('--color-primary')).toBe(ORG_BRAND_COLORS.primary))

    await qc.invalidateQueries({ queryKey: ['organization', 'me'] })

    await waitFor(() => expect(result.current.colors).toEqual(NEW_COLORS))
    expect(getCssVar('--color-primary')).toBe(NEW_COLORS.primary)
  })
})
