'use client'
import { useSetAtom } from 'jotai'
import { isOrderFormOpenAtom } from '../../store/ordersAtoms'

export interface UseOrdersPageReturn {
  onAdd: () => void
}

export const useOrdersPage = (): UseOrdersPageReturn => {
  const setFormOpen = useSetAtom(isOrderFormOpenAtom)

  return {
    onAdd: () => setFormOpen(true),
  }
}
