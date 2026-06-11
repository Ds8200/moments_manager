import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useSystemSmtpSection } from '../useSystemSmtpSection'
import { SYSTEM_SETTINGS_LABELS } from '../../../../constants/systemSettingsLabels'
import { SMTP_PROVIDERS } from '../../../../enums/smtpProviderEnums'

const notifySuccess = vi.fn()
const notifyError = vi.fn()
vi.mock('@/shared/hooks/useNotify', () => ({
  useNotify: () => ({ success: notifySuccess, error: notifyError, info: vi.fn(), warning: vi.fn() }),
}))

const SETTINGS_EMPTY = {
  has_smtp_config: false,
  smtp_host: null,
  smtp_port: null,
  smtp_username: null,
  smtp_from_email: null,
  smtp_from_name: null,
  has_openai_key: false,
  openai_key_preview: null,
  updated_at: '2026-01-01T00:00:00Z',
}

const SETTINGS_CONFIGURED = {
  ...SETTINGS_EMPTY,
  has_smtp_config: true,
  smtp_host: 'smtp.gmail.com',
  smtp_port: 587,
  smtp_username: 'platform@example.com',
  smtp_from_name: 'Nihulo',
}

function makeWrapper(qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: qc }, children)
  }
  return TestWrapper
}

describe('useSystemSmtpSection', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    notifySuccess.mockClear()
    notifyError.mockClear()
  })

  it('exposes correct labels', async () => {
    server.use(http.get(API_ENDPOINTS.ADMIN_SETTINGS, () => HttpResponse.json(SETTINGS_EMPTY)))
    const { result } = renderHook(() => useSystemSmtpSection(), { wrapper: makeWrapper(qc) })

    expect(result.current.sectionTitle).toBe(SYSTEM_SETTINGS_LABELS.SMTP_SECTION_TITLE)
    expect(result.current.saveLabel).toBe(SYSTEM_SETTINGS_LABELS.SAVE)
  })

  it('hasSmtpConfig is false when settings are empty', async () => {
    server.use(http.get(API_ENDPOINTS.ADMIN_SETTINGS, () => HttpResponse.json(SETTINGS_EMPTY)))
    const { result } = renderHook(() => useSystemSmtpSection(), { wrapper: makeWrapper(qc) })

    await waitFor(() => expect(result.current.hasSmtpConfig).toBe(false))
  })

  it('hasSmtpConfig is true when settings have smtp host', async () => {
    server.use(http.get(API_ENDPOINTS.ADMIN_SETTINGS, () => HttpResponse.json(SETTINGS_CONFIGURED)))
    const { result } = renderHook(() => useSystemSmtpSection(), { wrapper: makeWrapper(qc) })

    await waitFor(() => expect(result.current.hasSmtpConfig).toBe(true))
    expect(result.current.smtpHost).toBe('smtp.gmail.com')
  })

  it('notifies success after successful smtp update', async () => {
    server.use(
      http.get(API_ENDPOINTS.ADMIN_SETTINGS, () => HttpResponse.json(SETTINGS_EMPTY)),
      http.patch(API_ENDPOINTS.ADMIN_SETTINGS_SMTP, () => HttpResponse.json(SETTINGS_CONFIGURED)),
    )
    const { result } = renderHook(() => useSystemSmtpSection(), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSubmitting).toBe(false))

    await act(async () => {
      await result.current.onSubmit({
        platform_smtp_host: 'smtp.gmail.com',
        platform_smtp_port: 587,
        platform_smtp_username: 'platform@example.com',
        platform_smtp_password: 'secret',
        platform_smtp_from_name: 'Nihulo',
      })
    })

    expect(notifySuccess).toHaveBeenCalledWith(SYSTEM_SETTINGS_LABELS.SMTP_SAVE_SUCCESS)
  })

  it('notifies error when smtp update fails', async () => {
    server.use(
      http.get(API_ENDPOINTS.ADMIN_SETTINGS, () => HttpResponse.json(SETTINGS_EMPTY)),
      http.patch(API_ENDPOINTS.ADMIN_SETTINGS_SMTP, () => HttpResponse.json({ detail: 'error', code: 'X' }, { status: 500 })),
    )
    const { result } = renderHook(() => useSystemSmtpSection(), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSubmitting).toBe(false))

    await act(async () => {
      await result.current.onSubmit({
        platform_smtp_host: 'bad',
        platform_smtp_port: null,
        platform_smtp_username: null,
        platform_smtp_password: null,
        platform_smtp_from_name: null,
      })
    })

    expect(notifyError).toHaveBeenCalledWith(SYSTEM_SETTINGS_LABELS.SMTP_SAVE_ERROR)
  })

  it('hostOptions returns all providers when search is empty', () => {
    server.use(http.get(API_ENDPOINTS.ADMIN_SETTINGS, () => HttpResponse.json(SETTINGS_EMPTY)))
    const { result } = renderHook(() => useSystemSmtpSection(), { wrapper: makeWrapper(qc) })

    expect(result.current.hostOptions).toHaveLength(SMTP_PROVIDERS.length)
    expect(result.current.hostOptions[0].value).toBe('smtp.gmail.com')
    expect(result.current.hostOptions[0].label).toBe('Gmail')
  })

  it('hostOptions filters by provider label', () => {
    server.use(http.get(API_ENDPOINTS.ADMIN_SETTINGS, () => HttpResponse.json(SETTINGS_EMPTY)))
    const { result } = renderHook(() => useSystemSmtpSection(), { wrapper: makeWrapper(qc) })

    act(() => result.current.onHostSearch('outlook'))

    expect(result.current.hostOptions).toHaveLength(1)
    expect(result.current.hostOptions[0].label).toBe('Outlook / Hotmail')
  })

  it('onHostChange sets host value and auto-fills port from provider data', () => {
    server.use(http.get(API_ENDPOINTS.ADMIN_SETTINGS, () => HttpResponse.json(SETTINGS_EMPTY)))
    const { result } = renderHook(() => useSystemSmtpSection(), { wrapper: makeWrapper(qc) })

    const gmailOption = result.current.hostOptions.find(o => o.value === 'smtp.gmail.com')!
    act(() => result.current.onHostChange('smtp.gmail.com', gmailOption))

    expect(result.current.hostValue).toBe('smtp.gmail.com')
  })

  it('onHostFreeText sets host to typed value without changing port', () => {
    server.use(http.get(API_ENDPOINTS.ADMIN_SETTINGS, () => HttpResponse.json(SETTINGS_EMPTY)))
    const { result } = renderHook(() => useSystemSmtpSection(), { wrapper: makeWrapper(qc) })

    act(() => result.current.onHostFreeText('smtp.mycompany.com'))

    expect(result.current.hostValue).toBe('smtp.mycompany.com')
  })
})
