'use client'
import { useSetAtom } from 'jotai'
import { isUserFormOpenAtom } from '../../store/usersAtoms'
import { useAdminGuard } from '@/shared/hooks/useAdminGuard'

export interface UseUsersPageReturn {
  onAddUser: () => void
}

export const useUsersPage = (): UseUsersPageReturn => {
  useAdminGuard()
  const setFormOpen = useSetAtom(isUserFormOpenAtom)

  return {
    onAddUser: () => setFormOpen(true),
  }
}
