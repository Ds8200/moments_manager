'use client'
import { useRouter } from 'next/navigation'
import { useSetAtom } from 'jotai'
import { ROUTES } from '@/shared/constants/routes'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import { SUPER_ADMIN_LABELS } from '../../constants/superAdminLabels'
import { useOrgUser } from '../../queries/useOrgUser'
import { useDeleteOrgUser } from '../../queries/useSuperAdminUsers'
import { confirmDialogAtom } from '@/shared/store/globalAtoms'
import { formatDate } from '@/shared/utils/formatters'
import type { DetailSection } from '@/shared/components/DetailLayout/useDetailLayout'

export interface SuperAdminUserDetailPageProps {
  userId: string
}

export interface UseSuperAdminUserDetailPageReturn {
  title: string
  backLabel: string
  onBack: () => void
  deleteLabel: string
  onDelete: () => void
  sections: DetailSection[]
  isLoading: boolean
  isError: boolean
  errorMessage: string
}

export const useSuperAdminUserDetailPage = (
  props: SuperAdminUserDetailPageProps,
): UseSuperAdminUserDetailPageReturn => {
  const router = useRouter()
  const setConfirmDialog = useSetAtom(confirmDialogAtom)
  const { data, isLoading, isError } = useOrgUser(props.userId)
  const { mutate: deleteOrgUser } = useDeleteOrgUser()

  const onBack = (): void => router.push(ROUTES.SUPER_ADMIN_USERS_LIST)

  const onDelete = (): void => {
    setConfirmDialog({
      isOpen: true,
      options: {
        message: SUPER_ADMIN_LABELS.DETAIL_USER_DELETE_MSG,
        isDangerous: true,
        onConfirm: () =>
          deleteOrgUser(props.userId, {
            onSuccess: () => router.push(ROUTES.SUPER_ADMIN_USERS_LIST),
          }),
      },
    })
  }

  const sections: DetailSection[] = data
    ? [
        {
          fields: [
            { label: SUPER_ADMIN_LABELS.DETAIL_USER_FULL_NAME, value: data.full_name },
            { label: SUPER_ADMIN_LABELS.DETAIL_USER_EMAIL, value: data.email },
            { label: SUPER_ADMIN_LABELS.DETAIL_USER_PHONE, value: data.phone ?? UI_LABELS.NOT_SET },
            { label: SUPER_ADMIN_LABELS.DETAIL_USER_ORGS, value: String(data.org_count) },
            { label: SUPER_ADMIN_LABELS.DETAIL_USER_CREATED_AT, value: formatDate(data.created_at) },
          ],
        },
      ]
    : []

  return {
    title: data?.full_name ?? SUPER_ADMIN_LABELS.USER_DETAIL_TITLE,
    backLabel: UI_LABELS.BACK_TO_LIST,
    onBack,
    deleteLabel: UI_LABELS.DELETE,
    onDelete,
    sections,
    isLoading,
    isError,
    errorMessage: UI_LABELS.ERROR_LOADING_SUPER_ADMIN_USER_DETAIL,
  }
}
