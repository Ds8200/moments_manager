'use client'
import { apiClient } from '@/shared/utils/apiClient'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import { OrgOwnerEmailSchema } from './types'
import { z } from 'zod'
import type { AdminComposePayload, AdminComposeResponse, OrgOwnerEmail } from './types'

export const systemEmailApi = {
  getOrgOwners: (): Promise<OrgOwnerEmail[]> =>
    apiClient<unknown>(API_ENDPOINTS.ADMIN_ORG_OWNERS).then((r) =>
      z.array(OrgOwnerEmailSchema).parse(r),
    ),

  composeAdminEmail: (payload: AdminComposePayload): Promise<AdminComposeResponse> =>
    apiClient<AdminComposeResponse>(API_ENDPOINTS.ADMIN_EMAIL_COMPOSE, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}
