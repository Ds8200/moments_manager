import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { useOrgNameForm } from '../useOrgNameForm'
import { ORG_SETTINGS_LABELS } from '../../../../constants/orgSettingsLabels'

const notifySuccess = vi.fn()
const notifyError = vi.fn()
vi.mock('@/shared/hooks/useNotify', () => ({
  useNotify: () => ({ success: notifySuccess, error: notifyError, info: vi.fn(), warning: vi.fn() }),
}))

const ORG_RESPONSE = {
  id: 'org1',
  slug: 'cohen-print',
  name: 'דפוס כהן',
  logo_path: null,
  brand_colors: null,
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

async function fillName(result: { current: ReturnType<typeof useOrgNameForm> }, value: string): Promise<void> {
  await act(async () => {
    await result.current.register('name').onChange({ target: { name: 'name', value } })
  })
}

describe('useOrgNameForm', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    notifySuccess.mockClear()
    notifyError.mockClear()
  })

  it('rejects an empty name', async () => {
    // No ORGS_ME handler so the org query stays pending — form keeps the '' default value
    const { result } = renderHook(() => useOrgNameForm(), { wrapper: makeWrapper(qc) })

    await act(async () => {
      await result.current.handleSubmit(result.current.onSubmit)()
    })

    expect(result.current.errors.name?.message).toBe(ORG_SETTINGS_LABELS.NAME_REQUIRED)
  })

  it('prefills the name field once the organization loads', async () => {
    server.use(http.get(API_ENDPOINTS.ORGS_ME, () => HttpResponse.json(ORG_RESPONSE)))
    const { result } = renderHook(() => useOrgNameForm(), { wrapper: makeWrapper(qc) })

    await waitFor(() => expect(result.current.register('name').name).toBe('name'))
    expect(notifyError).not.toHaveBeenCalled()
  })

  it('updates the organization name on submit', async () => {
    server.use(
      http.get(API_ENDPOINTS.ORGS_ME, () => HttpResponse.json(ORG_RESPONSE)),
      http.patch(API_ENDPOINTS.ORGS_ME, () => HttpResponse.json({ ...ORG_RESPONSE, name: 'שם חדש' })),
    )
    const { result } = renderHook(() => useOrgNameForm(), { wrapper: makeWrapper(qc) })

    await waitFor(() => expect(result.current.errors.name).toBeUndefined())
    await fillName(result, 'שם חדש')
    await act(async () => {
      await result.current.handleSubmit(result.current.onSubmit)()
    })

    await waitFor(() => expect(result.current.errors.name).toBeUndefined())
  })

  it('exposes the section labels', () => {
    const { result } = renderHook(() => useOrgNameForm(), { wrapper: makeWrapper(qc) })

    expect(result.current.sectionTitle).toBe(ORG_SETTINGS_LABELS.NAME_SECTION_TITLE)
    expect(result.current.fieldLabel).toBe(ORG_SETTINGS_LABELS.NAME_LABEL)
    expect(result.current.saveBtnLabel).toBe(ORG_SETTINGS_LABELS.SAVE)
    expect(result.current.savingBtnLabel).toBe(ORG_SETTINGS_LABELS.SAVING)
  })
})
