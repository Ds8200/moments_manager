import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useLogoStep } from '../useLogoStep'
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

function makeWrapper(qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: qc }, children)
  }
  return TestWrapper
}

const BRAND_COLORS = {
  primary: '#9C27B0',
  secondary: '#6A1B7A',
  accent: '#D81B60',
  background: '#FFFFFF',
  text: '#212529',
}

const FILE = new File(['logo'], 'logo.png', { type: 'image/png' })

describe('useLogoStep', () => {
  let qc: QueryClient
  const onNext = vi.fn()

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    notifySuccess.mockClear()
    notifyError.mockClear()
    refreshMock.mockClear()
    onNext.mockClear()
  })

  it('starts with no color entries and cannot proceed', () => {
    const { result } = renderHook(() => useLogoStep({ onNext }), { wrapper: makeWrapper(qc) })
    expect(result.current.colorEntries).toHaveLength(0)
    expect(result.current.canProceed).toBe(false)
  })

  it('uploads the selected file, refreshes the server layout, and exposes the extracted palette', async () => {
    server.use(
      http.post(API_ENDPOINTS.ORGS_ME_LOGO, () =>
        HttpResponse.json({ logo_path: 'uploads/logos/org1/logo.png', brand_colors: BRAND_COLORS, message: 'ok' }),
      ),
    )
    const { result } = renderHook(() => useLogoStep({ onNext }), { wrapper: makeWrapper(qc) })

    await act(async () => {
      result.current.onFileChange({ target: { files: [FILE], value: '' } } as never)
    })

    await waitFor(() => expect(result.current.canProceed).toBe(true))
    expect(result.current.colorEntries).toEqual([
      { key: 'primary', label: ONBOARDING_LABELS.COLOR_PRIMARY, hex: BRAND_COLORS.primary },
      { key: 'secondary', label: ONBOARDING_LABELS.COLOR_SECONDARY, hex: BRAND_COLORS.secondary },
      { key: 'accent', label: ONBOARDING_LABELS.COLOR_ACCENT, hex: BRAND_COLORS.accent },
      { key: 'background', label: ONBOARDING_LABELS.COLOR_BACKGROUND, hex: BRAND_COLORS.background },
      { key: 'text', label: ONBOARDING_LABELS.COLOR_TEXT, hex: BRAND_COLORS.text },
    ])
    expect(notifySuccess).toHaveBeenCalledWith(ONBOARDING_LABELS.LOGO_UPLOADED_SUCCESS)
    expect(refreshMock).toHaveBeenCalledOnce()
  })

  it('notifies an error and keeps the next button disabled when the upload fails', async () => {
    server.use(http.post(API_ENDPOINTS.ORGS_ME_LOGO, () => HttpResponse.json({ detail: 'bad', code: 'X' }, { status: 422 })))
    const { result } = renderHook(() => useLogoStep({ onNext }), { wrapper: makeWrapper(qc) })

    await act(async () => {
      result.current.onFileChange({ target: { files: [FILE], value: '' } } as never)
    })

    await waitFor(() => expect(notifyError).toHaveBeenCalledWith(ONBOARDING_LABELS.LOGO_UPLOAD_ERROR))
    expect(result.current.canProceed).toBe(false)
    expect(refreshMock).not.toHaveBeenCalled()
  })

  it('does not upload when no file is selected', () => {
    const { result } = renderHook(() => useLogoStep({ onNext }), { wrapper: makeWrapper(qc) })

    act(() => {
      result.current.onFileChange({ target: { files: [], value: '' } } as never)
    })

    expect(result.current.canProceed).toBe(false)
    expect(refreshMock).not.toHaveBeenCalled()
  })

  it('calls onNext when the next step is requested', () => {
    const { result } = renderHook(() => useLogoStep({ onNext }), { wrapper: makeWrapper(qc) })

    act(() => {
      result.current.onNextClick()
    })

    expect(onNext).toHaveBeenCalledTimes(1)
  })
})
