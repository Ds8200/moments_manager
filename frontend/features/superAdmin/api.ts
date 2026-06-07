'use client'
import { apiClient } from '@/shared/utils/apiClient'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import type { OrgAdminResponse, OrgCreatePayload, OrgStatusUpdatePayload, OrgPlanUpdatePayload } from './types'
import type { PaginatedResponse } from '@/shared/types/pagination'

export const superAdminApi = {
  listOrgs: (page = 1, pageSize = 20): Promise<PaginatedResponse<OrgAdminResponse>> =>
    apiClient<PaginatedResponse<OrgAdminResponse>>(
      `${API_ENDPOINTS.ADMIN_ORGS}?page=${page}&page_size=${pageSize}`,
    ),

  createOrg: (payload: OrgCreatePayload): Promise<OrgAdminResponse> =>
    apiClient<OrgAdminResponse>(API_ENDPOINTS.ADMIN_ORGS, {
      method: 'POST',
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
}
