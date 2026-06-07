'use client'

import { useAtom, useAtomValue } from 'jotai'
import { useRouter } from 'next/navigation'
import { isSidebarOpenAtom } from '@/shared/store/globalAtoms'
import { useProfileQuery } from '@/features/profile/queries/useProfileQuery'
import { useDropdownMenu } from '@/shared/components/DropdownMenu/useDropdownMenu'
import { useLogout } from '@/shared/hooks/useLogout'
import { currentOrgRoleAtom, isSysAdminAtom } from '@/features/auth/store/authAtoms'
import { ORG_ROLE } from '@/features/organizations/enums/orgRoleEnums'
import { ROUTES } from '@/shared/constants/routes'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import type { DropdownMenuItem } from '@/shared/components/DropdownMenu/useDropdownMenu'
import type { UseDropdownMenuReturn } from '@/shared/components/DropdownMenu/useDropdownMenu'
import type { MouseEvent } from 'react'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return UI_LABELS.GOOD_MORNING
  if (hour >= 12 && hour < 17) return UI_LABELS.GOOD_AFTERNOON
  if (hour >= 17 && hour < 21) return UI_LABELS.GOOD_EVENING
  return UI_LABELS.GOOD_NIGHT
}

export interface UseHeaderReturn {
  greeting: string
  userName: string
  isSidebarOpen: boolean
  toggleSidebar: () => void
  profileMenu: UseDropdownMenuReturn
  onProfileClick: (e: MouseEvent<HTMLButtonElement>) => void
}

export const useHeader = (): UseHeaderReturn => {
  const [isSidebarOpen, setIsSidebarOpen] = useAtom(isSidebarOpenAtom)
  const { data: profile } = useProfileQuery()
  const router = useRouter()
  const { logout } = useLogout()
  const profileMenu = useDropdownMenu()
  const orgRole = useAtomValue(currentOrgRoleAtom)
  const isSysAdmin = useAtomValue(isSysAdminAtom)

  const toggleSidebar = (): void => setIsSidebarOpen((prev) => !prev)

  const userName = profile?.full_name ?? UI_LABELS.GREETING_FALLBACK

  const canManageOrg = !isSysAdmin && (orgRole === ORG_ROLE.OWNER || orgRole === ORG_ROLE.ADMIN)

  const profileRoute = isSysAdmin ? ROUTES.SUPER_ADMIN_PROFILE : ROUTES.PROFILE

  const profileItems: DropdownMenuItem[] = [
    {
      label: UI_LABELS.EDIT_PROFILE,
      icon: '👤',
      onClick: () => router.push(profileRoute),
    },
    ...(canManageOrg
      ? [
          {
            label: UI_LABELS.ORG_SETTINGS_MENU,
            icon: '🏢',
            onClick: () => router.push(ROUTES.SETTINGS),
          },
        ]
      : []),
    {
      label: UI_LABELS.LOGOUT,
      icon: '🚪',
      onClick: () => logout(),
      variant: 'danger',
    },
  ]

  const onProfileClick = (e: MouseEvent<HTMLButtonElement>): void => {
    profileMenu.openMenu(userName, profileItems, e)
  }

  return {
    greeting: getGreeting(),
    userName,
    isSidebarOpen,
    toggleSidebar,
    profileMenu,
    onProfileClick,
  }
}
