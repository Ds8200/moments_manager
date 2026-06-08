import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createStore, Provider } from 'jotai'
import { http, HttpResponse } from 'msw'
import { server } from '@/shared/mocks/server'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { accessTokenAtom } from '@/features/auth/store/authAtoms'
import { useAssistantName } from '../useAssistantName'
import { UI_LABELS } from '@/shared/constants/uiLabels'

function makeToken(payload: Record<string, unknown>): string {
  return `header.${btoa(JSON.stringify(payload))}.signature`
}

function makeWrapper(store: ReturnType<typeof createStore>, qc: QueryClient) {
  function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(
      QueryClientProvider,
      { client: qc },
      React.createElement(Provider, { store }, children),
    )
  }
  return TestWrapper
}

const ORG_STUB = {
  id: 'org1', slug: 'cohen', name: 'דפוס כהן', logo_path: null,
  brand_colors: null, plan: 'trial', trial_ends_at: null,
  is_active: true, max_users: 2, owner_id: 'u1',
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
  has_openai_key: false, openai_key_preview: null, has_smtp_config: false,
  smtp_host: null, smtp_port: null, smtp_username: null,
  smtp_from_email: null, smtp_from_name: null,
}

describe('useAssistantName', () => {
  let store: ReturnType<typeof createStore>
  let qc: QueryClient

  beforeEach(() => {
    store = createStore()
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  it('returns org name + AI when org is loaded', async () => {
    store.set(accessTokenAtom, makeToken({ sub: 'u1', sys_admin: false }))
    server.use(http.get(API_ENDPOINTS.ORGS_ME, () => HttpResponse.json(ORG_STUB)))

    const { result } = renderHook(() => useAssistantName(), { wrapper: makeWrapper(store, qc) })

    await waitFor(() => expect(result.current).toBe('דפוס כהן AI'))
  })

  it('returns fallback label when org data is not yet available', () => {
    const { result } = renderHook(() => useAssistantName(), { wrapper: makeWrapper(store, qc) })

    expect(result.current).toBe(UI_LABELS.AI_ASSISTANT_FALLBACK)
  })

  it('returns fallback label when org name is an empty string', async () => {
    store.set(accessTokenAtom, makeToken({ sub: 'u1', sys_admin: false }))
    server.use(http.get(API_ENDPOINTS.ORGS_ME, () => HttpResponse.json({ ...ORG_STUB, name: '' })))

    const { result } = renderHook(() => useAssistantName(), { wrapper: makeWrapper(store, qc) })

    await waitFor(() => expect(result.current).toBe(UI_LABELS.AI_ASSISTANT_FALLBACK))
  })

  it('does not fetch org data and returns fallback when user is sys_admin', () => {
    store.set(accessTokenAtom, makeToken({ sub: 'u1', sys_admin: true }))

    const { result } = renderHook(() => useAssistantName(), { wrapper: makeWrapper(store, qc) })

    expect(result.current).toBe(UI_LABELS.AI_ASSISTANT_FALLBACK)
  })
})
