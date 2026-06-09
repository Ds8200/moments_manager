'use client'
import { useAtom } from 'jotai'
import { superAdminTabAtom } from '../../store/superAdminAtoms'
import { SUPER_ADMIN_LABELS } from '../../constants/superAdminLabels'

export interface UseSuperAdminOrgsPageReturn {
  activeTab: 0 | 1
  setActiveTab: (tab: 0 | 1) => void
  tabBusinesses: string
  tabUsers: string
}

export const useSuperAdminOrgsPage = (): UseSuperAdminOrgsPageReturn => {
  const [activeTab, setActiveTab] = useAtom(superAdminTabAtom)
  return {
    activeTab,
    setActiveTab,
    tabBusinesses: SUPER_ADMIN_LABELS.TAB_BUSINESSES,
    tabUsers: SUPER_ADMIN_LABELS.TAB_USERS,
  }
}
