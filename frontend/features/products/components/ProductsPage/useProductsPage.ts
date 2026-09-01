'use client'
import { useSetAtom } from 'jotai'
import { isProductFormOpenAtom } from '../../store/productsAtoms'

export interface UseProductsPageReturn {
  onAdd: () => void
}

export const useProductsPage = (): UseProductsPageReturn => {
  const setFormOpen = useSetAtom(isProductFormOpenAtom)

  return {
    onAdd: () => setFormOpen(true),
  }
}
