import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useAssistantName } from '../useAssistantName'
import type { UseQueryResult } from '@tanstack/react-query'
import type { OrgResponse } from '@/features/organizations/types'

vi.mock('@/features/organizations/queries/useOrganizations', () => ({
  useMyOrg: vi.fn(),
}))

import { useMyOrg } from '@/features/organizations/queries/useOrganizations'

describe('useAssistantName', () => {
  it('returns org name + AI when org is loaded', () => {
    vi.mocked(useMyOrg).mockReturnValue({
      data: { name: 'דפוס כהן' } as OrgResponse,
    } as UseQueryResult<OrgResponse>)

    const { result } = renderHook(() => useAssistantName())

    expect(result.current).toBe('דפוס כהן AI')
  })

  it('returns fallback label when org data is not yet available', () => {
    vi.mocked(useMyOrg).mockReturnValue({
      data: undefined,
    } as UseQueryResult<OrgResponse>)

    const { result } = renderHook(() => useAssistantName())

    expect(result.current).toBe('עוזר AI')
  })

  it('returns fallback label when org name is an empty string', () => {
    vi.mocked(useMyOrg).mockReturnValue({
      data: { name: '' } as OrgResponse,
    } as UseQueryResult<OrgResponse>)

    const { result } = renderHook(() => useAssistantName())

    expect(result.current).toBe('עוזר AI')
  })
})
