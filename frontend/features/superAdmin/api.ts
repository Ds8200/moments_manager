'use client'
import { apiClient } from '@/shared/utils/apiClient'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import type {
  OrgActionResponse,
  OrgAdminResponse,
  OrgCreatePayload,
  OrgListFilters,
  OrgOwnerAdminResponse,
  OrgPlanUpdatePayload,
  OrgStatusUpdatePayload,
  OrgUpdatePayload,
  UserListFilters,
  UserSearchResult,
} from './types'
import type { PaginatedResponse } from '@/shared/types/pagination'

function buildOrgListUrl(filters: Partial<OrgListFilters>): string {
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.page_size) params.set('page_size', String(filters.page_size))
  if (filters.search) params.set('search', filters.search)
  if (filters.plan) params.set('plan', filters.plan)
  if (filters.is_active !== undefined && filters.is_active !== '')
    params.set('is_active', filters.is_active)
  return `${API_ENDPOINTS.ADMIN_ORGS}?${params.toString()}`
}

export const superAdminApi = {
  listOrgs: (filters: Partial<OrgListFilters> = {}): Promise<PaginatedResponse<OrgAdminResponse>> =>
    apiClient<PaginatedResponse<OrgAdminResponse>>(buildOrgListUrl(filters)),

  getOrg: (id: string): Promise<OrgAdminResponse> =>
    apiClient<OrgAdminResponse>(API_ENDPOINTS.ADMIN_ORG(id)),

  createOrg: (payload: OrgCreatePayload): Promise<OrgAdminResponse> =>
    apiClient<OrgAdminResponse>(API_ENDPOINTS.ADMIN_ORGS, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateOrg: (id: string, payload: OrgUpdatePayload): Promise<OrgAdminResponse> =>
    apiClient<OrgAdminResponse>(API_ENDPOINTS.ADMIN_ORG(id), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  updateOrgStatus: (id: string, payload: OrgStatusUpdatePayload): Promise<OrgAdminResponse> =>
    apiClient<OrgAdminResponse>(API_ENDPOINTS.ADMIN_ORG_STATUS(id), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  updateOrgPlan: (id: string, payload: OrgPlanUpdatePayload): Promise<OrgAdminResponse> =>
    apiClient<OrgAdminResponse>(API_ENDPOINTS.ADMIN_ORG_PLAN(id), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteOrg: (id: string): Promise<OrgActionResponse> =>
    apiClient<OrgActionResponse>(API_ENDPOINTS.ADMIN_ORG(id), { method: 'DELETE' }),

  resetOrgOwnerPassword: (id: string): Promise<OrgActionResponse> =>
    apiClient<OrgActionResponse>(API_ENDPOINTS.ADMIN_ORG_RESET_PASSWORD(id), { method: 'POST' }),

  listOrgUsers: (
    filters: Partial<UserListFilters> = {},
  ): Promise<PaginatedResponse<OrgOwnerAdminResponse>> => {
    const params = new URLSearchParams()
    if (filters.page) params.set('page', String(filters.page))
    if (filters.page_size) params.set('page_size', String(filters.page_size))
    if (filters.search) params.set('search', filters.search)
    return apiClient<PaginatedResponse<OrgOwnerAdminResponse>>(
      `${API_ENDPOINTS.ADMIN_ORG_USERS}?${params.toString()}`,
    )
  },

  deleteOrgUser: (id: string): Promise<OrgActionResponse> =>
    apiClient<OrgActionResponse>(API_ENDPOINTS.ADMIN_ORG_USER(id), { method: 'DELETE' }),

  getOrgUser: (id: string): Promise<OrgOwnerAdminResponse> =>
    apiClient<OrgOwnerAdminResponse>(API_ENDPOINTS.ADMIN_ORG_USER(id)),

  searchUsers: (q: string): Promise<UserSearchResult[]> =>
    apiClient<UserSearchResult[]>(`${API_ENDPOINTS.ADMIN_ORG_USERS_SEARCH}?q=${encodeURIComponent(q)}`),
}
