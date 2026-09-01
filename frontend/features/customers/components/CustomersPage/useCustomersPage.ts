'use client'
import { useSetAtom } from 'jotai'
import { isCustomerFormOpenAtom } from '../../store/customersAtoms'

export interface UseCustomersPageReturn {
  onAdd: () => void
}

export const useCustomersPage = (): UseCustomersPageReturn => {
  const setFormOpen = useSetAtom(isCustomerFormOpenAtom)

  return {
    onAdd: () => setFormOpen(true),
  }
}
