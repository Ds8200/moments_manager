'use client'
import { apiClient, apiUpload } from '@/shared/utils/apiClient'
import { API_ENDPOINTS } from '@/shared/constants/apiEndpoints'
import type {
  InvitePayload,
  InviteResponse,
  Member,
  OrgBrandingUploadResponse,
  OrgResponse,
  OrgUpdatePayload,
} from './types'

export const organizationsApi = {
  getMyOrg: (): Promise<OrgResponse> => apiClient<OrgResponse>(API_ENDPOINTS.ORGS_ME),

  updateMyOrg: (payload: OrgUpdatePayload): Promise<OrgResponse> =>
    apiClient<OrgResponse>(API_ENDPOINTS.ORGS_ME, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  uploadLogo: (file: File): Promise<OrgBrandingUploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    return apiUpload<OrgBrandingUploadResponse>(API_ENDPOINTS.ORGS_ME_LOGO, formData)
  },

  listMembers: (): Promise<Member[]> => apiClient<Member[]>(API_ENDPOINTS.ORGS_ME_MEMBERS),

  inviteMember: (payload: InvitePayload): Promise<InviteResponse> =>
    apiClient<InviteResponse>(API_ENDPOINTS.ORGS_ME_INVITE, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  removeMember: (userId: string): Promise<void> =>
    apiClient<void>(API_ENDPOINTS.ORGS_ME_MEMBER(userId), { method: 'DELETE' }),
}
