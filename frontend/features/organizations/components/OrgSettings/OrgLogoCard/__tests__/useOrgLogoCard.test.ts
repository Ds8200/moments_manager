import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useOrgLogoCard } from '../useOrgLogoCard'
import { ORG_SETTINGS_LABELS } from '../../../../constants/orgSettingsLabels'
import { ONBOARDING_LABELS } from '../../../../constants/onboardingLabels'

const notifySuccess = vi.fn()
const notifyError = vi.fn()
vi.mock('@/shared/hooks/useNotify', () => ({
  useNotify: () => ({ success: notifySuccess, error: notifyError, info: vi.fn(), warning: vi.fn() }),
}))

const refreshMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock }),
}))

const BRAND_COLORS = {
  primary: '#9C27B0',
  secondary: '#6A1B7A',
  accent: '#D81B60',
  background: '#FFFFFF',
  text: '#212529',
}

const ORG_RESPONSE = {
  id: 'org1',
  slug: 'cohen-print',
  name: 'דפוס כהן',
  logo_path: 'uploads/logos/org1/old-logo.png',
  brand_colors: BRAND_COLORS,
  plan: 'trial',
  trial_ends_at: null,
  is_active: true,
  max_users: 2,
  owner_id: 'user1',
  created_at: '2026-06-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
}

const FILE = new File(['logo'], 'logo.png', { type: 'image/png' })

function makeWrapper(qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: qc }, children)
  }
  return TestWrapper
}

describe('useOrgLogoCard', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    notifySuccess.mockClear()
    notifyError.mockClear()
    refreshMock.mockClear()
    server.use(http.get(API_ENDPOINTS.ORGS_ME, () => HttpResponse.json(ORG_RESPONSE)))
  })

  it('shows the current logo path and palette from the loaded organization', async () => {
    const { result } = renderHook(() => useOrgLogoCard(), { wrapper: makeWrapper(qc) })

    await waitFor(() => expect(result.current.logoPath).toBe(ORG_RESPONSE.logo_path))
    expect(result.current.colorEntries).toEqual([
      { key: 'primary', label: ORG_SETTINGS_LABELS.COLOR_PRIMARY, hex: BRAND_COLORS.primary },
      { key: 'secondary', label: ORG_SETTINGS_LABELS.COLOR_SECONDARY, hex: BRAND_COLORS.secondary },
      { key: 'accent', label: ORG_SETTINGS_LABELS.COLOR_ACCENT, hex: BRAND_COLORS.accent },
      { key: 'background', label: ORG_SETTINGS_LABELS.COLOR_BACKGROUND, hex: BRAND_COLORS.background },
      { key: 'text', label: ORG_SETTINGS_LABELS.COLOR_TEXT, hex: BRAND_COLORS.text },
    ])
  })

  it('uploads a new logo, refreshes the server layout, and prefers the freshly extracted palette', async () => {
    const NEW_COLORS = { ...BRAND_COLORS, primary: '#000000' }
    server.use(
      http.post(API_ENDPOINTS.ORGS_ME_LOGO, () =>
        HttpResponse.json({ logo_path: 'uploads/logos/org1/new-logo.png', brand_colors: NEW_COLORS, message: 'ok' }),
      ),
    )
    const { result } = renderHook(() => useOrgLogoCard(), { wrapper: makeWrapper(qc) })

    await act(async () => {
      result.current.onFileChange({ target: { files: [FILE], value: '' } } as never)
    })

    await waitFor(() => expect(result.current.logoPath).toBe('uploads/logos/org1/new-logo.png'))
    expect(result.current.colorEntries[0]).toEqual({
      key: 'primary',
      label: ORG_SETTINGS_LABELS.COLOR_PRIMARY,
      hex: NEW_COLORS.primary,
    })
    expect(notifySuccess).toHaveBeenCalledWith(ONBOARDING_LABELS.LOGO_UPLOADED_SUCCESS)
    expect(refreshMock).toHaveBeenCalledOnce()
  })

  it('notifies an error when the upload fails', async () => {
    server.use(http.post(API_ENDPOINTS.ORGS_ME_LOGO, () => HttpResponse.json({ detail: 'bad', code: 'X' }, { status: 422 })))
    const { result } = renderHook(() => useOrgLogoCard(), { wrapper: makeWrapper(qc) })

    await act(async () => {
      result.current.onFileChange({ target: { files: [FILE], value: '' } } as never)
    })

    await waitFor(() => expect(notifyError).toHaveBeenCalledWith(ONBOARDING_LABELS.LOGO_UPLOAD_ERROR))
    expect(refreshMock).not.toHaveBeenCalled()
  })

  it('does not upload when no file is selected', async () => {
    const { result } = renderHook(() => useOrgLogoCard(), { wrapper: makeWrapper(qc) })

    await waitFor(() => expect(result.current.logoPath).toBe(ORG_RESPONSE.logo_path))
    act(() => {
      result.current.onFileChange({ target: { files: [], value: '' } } as never)
    })

    expect(result.current.isUploading).toBe(false)
    expect(refreshMock).not.toHaveBeenCalled()
  })

  it('shows the placeholder label when the organization has no logo', async () => {
    server.use(http.get(API_ENDPOINTS.ORGS_ME, () => HttpResponse.json({ ...ORG_RESPONSE, logo_path: null, brand_colors: null })))
    const { result } = renderHook(() => useOrgLogoCard(), { wrapper: makeWrapper(qc) })

    await waitFor(() => expect(result.current.logoPath).toBeNull())
    expect(result.current.colorEntries).toHaveLength(0)
    expect(result.current.noLogoLabel).toBe(ORG_SETTINGS_LABELS.NO_LOGO)
  })
})
