'use client'
import { useLogout } from '@/shared/hooks/useLogout'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import type { NavItem } from '@/shared/constants/routes'

export interface MoreMenuProps {
  overflowItems: NavItem[]
  pathname: string
  onClose: () => void
}

export interface UseMoreMenuReturn {
  items: NavItem[]
  pathname: string
  title: string
  logoutLabel: string
  onClose: () => void
  onLogout: () => Promise<void>
}

export const useMoreMenu = (props: MoreMenuProps): UseMoreMenuReturn => {
  const { overflowItems, pathname, onClose } = props
  const { logout } = useLogout()

  const onLogout = async (): Promise<void> => {
    onClose()
    await logout()
  }

  return {
    items: overflowItems,
    pathname,
    title: UI_LABELS.MENU_TITLE,
    logoutLabel: UI_LABELS.LOGOUT,
    onClose,
    onLogout,
  }
}
