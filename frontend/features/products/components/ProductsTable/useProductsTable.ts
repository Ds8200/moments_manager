'use client'
import { type MouseEvent } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { useProducts, useDeleteProduct } from '../../queries/useProducts'
import { productFiltersAtom, isProductFormOpenAtom, editingProductIdAtom } from '../../store/productsAtoms'
import { formatCurrency } from '@/shared/utils/formatters'
import { PRODUCTS_LABELS } from '../../constants/productsLabels'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { useDropdownMenu } from '@/shared/components/DropdownMenu/useDropdownMenu'
import type { Product } from '../../types'
import type { DropdownMenuState } from '@/shared/components/DropdownMenu/useDropdownMenu'

export interface UseProductsTableReturn {
  products: Product[]
  total: number
  currentPage: number
  totalPages: number
  isLoading: boolean
  isError: boolean
  menuState: DropdownMenuState
  onRowClick: (product: Product, e: MouseEvent<Element>) => void
  closeMenu: () => void
  onPageChange: (page: number) => void
  formatAmount: (value: string | number) => string
}

export const useProductsTable = (): UseProductsTableReturn => {
  const filters = useAtomValue(productFiltersAtom)
  const setFilters = useSetAtom(productFiltersAtom)
  const setFormOpen = useSetAtom(isProductFormOpenAtom)
  const setEditingId = useSetAtom(editingProductIdAtom)
  const deleteProduct = useDeleteProduct()
  const confirm = useConfirm()
  const { menuState, openMenu, closeMenu } = useDropdownMenu()

  const { data, isLoading, isError } = useProducts(filters.page, filters.search, filters.is_active)

  const onEdit = (id: string): void => {
    setEditingId(id)
    setFormOpen(true)
  }

  const onDelete = (id: string, name: string): void => {
    confirm({
      message: `${PRODUCTS_LABELS.CONFIRM_DELETE} ${name}?`,
      isDangerous: true,
      onConfirm: () => deleteProduct.mutate(id),
    })
  }

  const onRowClick = (product: Product, e: MouseEvent<Element>): void => {
    openMenu(product.name, [
      { label: PRODUCTS_LABELS.TABLE_EDIT_TITLE, icon: '✏️', onClick: () => onEdit(product.id) },
      { label: PRODUCTS_LABELS.TABLE_DELETE_TITLE, icon: '🗑️', onClick: () => onDelete(product.id, product.name), variant: 'danger' },
    ], e)
  }

  return {
    products: data?.items ?? [],
    total: data?.total ?? 0,
    currentPage: data?.page ?? 1,
    totalPages: data?.pages ?? 1,
    isLoading,
    isError,
    menuState,
    onRowClick,
    closeMenu,
    onPageChange: (page) => setFilters((prev) => ({ ...prev, page })),
    formatAmount: formatCurrency,
  }
}
