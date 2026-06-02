'use client'
import { useAtomValue, useSetAtom } from 'jotai'
import { useProducts, useDeleteProduct } from '../../queries/useProducts'
import { productFiltersAtom, isProductFormOpenAtom, editingProductIdAtom } from '../../store/productsAtoms'
import { formatCurrency } from '@/shared/utils/formatters'
import { PRODUCTS_LABELS } from '../../constants/productsLabels'
import type { Product } from '../../types'

export interface UseProductsTableReturn {
  products: Product[]
  total: number
  currentPage: number
  totalPages: number
  isLoading: boolean
  isError: boolean
  onEdit: (id: string) => void
  onDelete: (id: string, name: string) => void
  onPageChange: (page: number) => void
  formatAmount: (value: string | number) => string
}

export const useProductsTable = (): UseProductsTableReturn => {
  const filters = useAtomValue(productFiltersAtom)
  const setFilters = useSetAtom(productFiltersAtom)
  const setFormOpen = useSetAtom(isProductFormOpenAtom)
  const setEditingId = useSetAtom(editingProductIdAtom)
  const deleteProduct = useDeleteProduct()

  const { data, isLoading, isError } = useProducts(filters.page, filters.search, filters.is_active)

  return {
    products: data?.items ?? [],
    total: data?.total ?? 0,
    currentPage: data?.page ?? 1,
    totalPages: data?.pages ?? 1,
    isLoading,
    isError,

    onEdit: (id) => {
      setEditingId(id)
      setFormOpen(true)
    },

    onDelete: (id, name) => {
      if (window.confirm(`${PRODUCTS_LABELS.CONFIRM_DELETE} ${name}?`)) {
        deleteProduct.mutate(id)
      }
    },

    onPageChange: (page) => setFilters((prev) => ({ ...prev, page })),

    formatAmount: formatCurrency,
  }
}
