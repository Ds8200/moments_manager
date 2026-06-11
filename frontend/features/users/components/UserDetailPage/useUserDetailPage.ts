'use client'
import { useRouter } from 'next/navigation'
import { useSetAtom } from 'jotai'
import { ROUTES } from '@/shared/constants/routes'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import { USERS_LABELS, USER_ROLE_VALUES } from '../../constants/usersLabels'
import { useUser } from '../../queries/useUser'
import { useDeleteUser } from '../../queries/useUsers'
import { confirmDialogAtom } from '@/shared/store/globalAtoms'
import { formatDate } from '@/shared/utils/formatters'
import type { DetailSection } from '@/shared/components/DetailLayout/useDetailLayout'

export interface UserDetailPageProps {
  userId: string
}

export interface UseUserDetailPageReturn {
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

export const useUserDetailPage = (props: UserDetailPageProps): UseUserDetailPageReturn => {
  const router = useRouter()
  const setConfirmDialog = useSetAtom(confirmDialogAtom)
  const { data, isLoading, isError } = useUser(props.userId)
  const { mutate: deleteUser } = useDeleteUser()

  const onBack = (): void => router.push(ROUTES.USERS)

  const onDelete = (): void => {
    setConfirmDialog({
      isOpen: true,
      options: {
        message: USERS_LABELS.DETAIL_DELETE_MSG,
        isDangerous: true,
        onConfirm: () =>
          deleteUser(props.userId, {
            onSuccess: () => router.push(ROUTES.USERS),
          }),
      },
    })
  }

  const roleLabel = data?.role === USER_ROLE_VALUES.ADMIN ? USERS_LABELS.ROLE_ADMIN : USERS_LABELS.ROLE_USER
  const statusLabel = data?.is_active ? USERS_LABELS.STATUS_ACTIVE : USERS_LABELS.STATUS_INACTIVE

  const sections: DetailSection[] = data
    ? [
        {
          fields: [
            { label: USERS_LABELS.DETAIL_FULL_NAME, value: data.full_name },
            { label: USERS_LABELS.DETAIL_EMAIL, value: data.email },
            { label: USERS_LABELS.DETAIL_ROLE, value: roleLabel },
            { label: USERS_LABELS.DETAIL_STATUS, value: statusLabel },
            { label: USERS_LABELS.DETAIL_CREATED_AT, value: formatDate(data.created_at) },
          ],
        },
      ]
    : []

  return {
    title: data?.full_name ?? USERS_LABELS.DETAIL_TITLE,
    backLabel: UI_LABELS.BACK_TO_LIST,
    onBack,
    deleteLabel: UI_LABELS.DELETE,
    onDelete,
    sections,
    isLoading,
    isError,
    errorMessage: UI_LABELS.ERROR_LOADING_USER_DETAIL,
  }
}
