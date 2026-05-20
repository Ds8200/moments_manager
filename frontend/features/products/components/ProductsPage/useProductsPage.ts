'use client'
import { useState } from 'react'
import { useSetAtom } from 'jotai'
import { useProducts, useDeleteProduct } from '../../queries/useProducts'
import { isProductFormOpenAtom, editingProductIdAtom } from '../../store/productsAtoms'
import { PRODUCTS_LABELS } from '../../constants/productsLabels'
import { formatCurrency } from '@/shared/utils/formatters'
import type { ProductsResponse } from '../../types'

export interface UseProductsPageReturn {
  data: ProductsResponse | undefined
  isLoading: boolean
  isError: boolean
  page: number
  search: string
  onSearchChange: (value: string) => void
  onNew: () => void
  onEdit: (id: string) => void
  onDelete: (id: string, name: string) => void
  calcProfit: (price: string, cost: string) => string
  formatAmount: (value: string | number) => string
}

export const useProductsPage = (): UseProductsPageReturn => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isLoading, isError } = useProducts(page, search)
  const deleteProduct = useDeleteProduct()
  const setOpen = useSetAtom(isProductFormOpenAtom)
  const setEditingId = useSetAtom(editingProductIdAtom)

  const onSearchChange = (value: string): void => {
    setSearch(value)
    setPage(1)
  }

  const onNew = (): void => setOpen(true)

  const onEdit = (id: string): void => {
    setEditingId(id)
    setOpen(true)
  }

  const onDelete = (id: string, name: string): void => {
    if (window.confirm(`${PRODUCTS_LABELS.CONFIRM_DELETE} ${name}?`)) {
      deleteProduct.mutate(id)
    }
  }

  const calcProfit = (price: string, cost: string): string =>
    formatCurrency(parseFloat(price) - parseFloat(cost))

  return {
    data,
    isLoading,
    isError,
    page,
    search,
    onSearchChange,
    onNew,
    onEdit,
    onDelete,
    calcProfit,
    formatAmount: formatCurrency,
  }
}
