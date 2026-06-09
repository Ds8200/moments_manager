'use client'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { organizationsApi } from '../api'
import { useNotify } from '@/shared/hooks/useNotify'
import { ONBOARDING_LABELS } from '../constants/onboardingLabels'
import { ORG_SETTINGS_LABELS } from '../constants/orgSettingsLabels'
import type {
  InvitePayload,
  InviteResponse,
  Member,
  OrgBrandingUploadResponse,
  OrgResponse,
  OrgUpdatePayload,
} from '../types'

export const useMyOrg = (): UseQueryResult<OrgResponse> =>
  useQuery({
    queryKey: ['organization', 'me'],
    queryFn: () => organizationsApi.getMyOrg(),
  })

export const useOrgMembers = (): UseQueryResult<Member[]> =>
  useQuery({
    queryKey: ['organization', 'members'],
    queryFn: () => organizationsApi.listMembers(),
  })

export const useUpdateMyOrg = (): UseMutationResult<OrgResponse, Error, OrgUpdatePayload> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: OrgUpdatePayload) => organizationsApi.updateMyOrg(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', 'me'] })
    },
  })
}

export const useUploadLogo = (): UseMutationResult<OrgBrandingUploadResponse, Error, File> => {
  const queryClient = useQueryClient()
  const notify = useNotify()
  const router = useRouter()
  return useMutation({
    mutationFn: (file: File) => organizationsApi.uploadLogo(file),
    onSuccess: (data) => {
      // Patch the cache immediately so BrandThemeApplier applies new colors
      // before the background refetch completes — avoids a race with router.refresh().
      queryClient.setQueryData<OrgResponse>(['organization', 'me'], (old) =>
        old ? { ...old, logo_path: data.logo_path, brand_colors: data.brand_colors } : old
      )
      queryClient.invalidateQueries({ queryKey: ['organization', 'me'] })
      notify.success(ONBOARDING_LABELS.LOGO_UPLOADED_SUCCESS)
      // Re-run Server Components so AppLayout picks up the new logo and brand colors immediately.
      router.refresh()
    },
    onError: () => notify.error(ONBOARDING_LABELS.LOGO_UPLOAD_ERROR),
  })
}

export const useInviteMember = (): UseMutationResult<InviteResponse, Error, InvitePayload> => {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: (payload: InvitePayload) => organizationsApi.inviteMember(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', 'members'] })
      notify.success(ONBOARDING_LABELS.INVITE_SENT_SUCCESS)
    },
    onError: () => notify.error(ONBOARDING_LABELS.INVITE_ERROR),
  })
}

export const useRemoveMember = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: (userId: string) => organizationsApi.removeMember(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', 'members'] })
      notify.success(ORG_SETTINGS_LABELS.MEMBER_REMOVED_SUCCESS)
    },
    onError: () => notify.error(ORG_SETTINGS_LABELS.MEMBER_REMOVE_ERROR),
  })
}
