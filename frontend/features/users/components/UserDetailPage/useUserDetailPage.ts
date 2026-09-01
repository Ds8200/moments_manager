'use client'
import { useRouter } from 'next/navigation'
import { useAtomValue } from 'jotai'
import { useQueryClient } from '@tanstack/react-query'
import { useUser, useUpdateUserRole } from '../../queries/useUser'
import { useDeleteUser } from '../../queries/useUsers'
import { useUpdateNameMutation } from '@/features/profile/queries/useUpdateNameMutation'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { ROUTES } from '@/shared/constants/routes'
import { USERS_LABELS, USER_ROLE_VALUES } from '../../constants/usersLabels'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import { currentUserIdAtom, isAdminAtom } from '@/features/auth/store/authAtoms'
import type { DropdownMenuItem } from '@/shared/components/DropdownMenu/useDropdownMenu'
import type { User, UserFormValues } from '../../types'

export interface UserDetailPageProps {
  userId: string
}

export interface SelectOption {
  value: string
  label: string
}

export interface UseUserDetailPageReturn {
  user: User | undefined
  isLoading: boolean
  isError: boolean
  refetch: () => void
  backLabel: string
  menuTitle: string
  menuItems: DropdownMenuItem[]
  sectionInfoLabel: string
  labelName: string
  labelEmail: string
  labelRole: string
  labelStatus: string
  isOwnRow: boolean
  isAdmin: boolean
  roleOptions: SelectOption[]
  currentRole: string
  currentRoleLabel: string
  formattedStatus: string
  onSaveName: (v: string) => void
  onRoleChange: (v: string) => void
  noop: () => void
}

export const useUserDetailPage = (props: UserDetailPageProps): UseUserDetailPageReturn => {
  const { userId } = props
  const router = useRouter()
  const queryClient = useQueryClient()
  const currentUserId = useAtomValue(currentUserIdAtom)
  const isAdmin = useAtomValue(isAdminAtom)
  const { data: user, isLoading, isError, refetch } = useUser(userId)
  const updateName = useUpdateNameMutation()
  const updateRole = useUpdateUserRole()
  const deleteUser = useDeleteUser()
  const confirm = useConfirm()

  const isOwnRow = userId === currentUserId

  const onDelete = (): void => {
    confirm({
      message: `${USERS_LABELS.CONFIRM_DELETE} ${user?.full_name ?? ''}?`,
      isDangerous: true,
      onConfirm: () =>
        deleteUser.mutate(userId, {
          onSuccess: () => router.push(ROUTES.USERS),
        }),
    })
  }

  // no delete action available on your own row
  const menuItems: DropdownMenuItem[] = isOwnRow ? [] : [
    { label: USERS_LABELS.TABLE_DELETE_TITLE, icon: UI_SYMBOLS.DELETE, onClick: onDelete, variant: 'danger' as const },
  ]

  const roleOptions: SelectOption[] = [
    { value: USER_ROLE_VALUES.USER, label: USERS_LABELS.ROLE_USER },
    { value: USER_ROLE_VALUES.ADMIN, label: USERS_LABELS.ROLE_ADMIN },
  ]

  return {
    user,
    isLoading,
    isError,
    refetch,

    backLabel: USERS_LABELS.DETAIL_PAGE_BACK,
    menuTitle: user?.full_name ?? '',
    menuItems,

    sectionInfoLabel: USERS_LABELS.DETAIL_SECTION_INFO,
    labelName: USERS_LABELS.DETAIL_LABEL_NAME,
    labelEmail: USERS_LABELS.DETAIL_LABEL_EMAIL,
    labelRole: USERS_LABELS.DETAIL_LABEL_ROLE,
    labelStatus: USERS_LABELS.DETAIL_LABEL_STATUS,

    isOwnRow,
    isAdmin,
    roleOptions,
    currentRole: user?.role ?? USER_ROLE_VALUES.USER,
    currentRoleLabel: user?.role === USER_ROLE_VALUES.ADMIN ? USERS_LABELS.ROLE_ADMIN : USERS_LABELS.ROLE_USER,
    formattedStatus: user?.is_active ? USERS_LABELS.STATUS_ACTIVE : USERS_LABELS.STATUS_INACTIVE,

    // only the user themself may rename their own account
    onSaveName: (value) => {
      updateName.mutate(
        { full_name: value },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', userId] }) },
      )
    },

    // only an admin may change someone's role — enforced again on the backend
    onRoleChange: (value) => updateRole.mutate({ id: userId, role: value as UserFormValues['role'] }),

    // the email field is permanently read-only — this satisfies InlineEditField's required onSave prop
    noop: () => {},
  }
}
