'use client'
import { useAtomValue, useSetAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { useProducts, useDeleteProduct } from '../../queries/useProducts'
import { productFiltersAtom } from '../../store/productsAtoms'
import { formatCurrency } from '@/shared/utils/formatters'
import { PRODUCTS_LABELS } from '../../constants/productsLabels'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { useTableRowInteraction } from '@/shared/hooks/useTableRowInteraction'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import { ROUTE_ICONS, PRODUCT_DETAIL_ROUTE } from '@/shared/constants/routes'
import type { RowInteractionHandlers } from '@/shared/hooks/useTableRowInteraction'
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
  getRowProps: (product: Product) => RowInteractionHandlers
  closeMenu: () => void
  onPageChange: (page: number) => void
  formatAmount: (value: string | number) => string
  emptyIcon: string
  emptyValue: string
}

export const useProductsTable = (): UseProductsTableReturn => {
  const filters = useAtomValue(productFiltersAtom)
  const setFilters = useSetAtom(productFiltersAtom)
  const router = useRouter()
  const deleteProduct = useDeleteProduct()
  const confirm = useConfirm()
  const { menuState, closeMenu, getRowProps } = useTableRowInteraction()

  const { data, isLoading, isError } = useProducts(filters.page, filters.search, filters.is_active)

  const onDelete = (id: string, name: string): void => {
    confirm({
      message: `${PRODUCTS_LABELS.CONFIRM_DELETE} ${name}?`,
      isDangerous: true,
      onConfirm: () => deleteProduct.mutate(id),
    })
  }

  return {
    products: data?.items ?? [],
    total: data?.total ?? 0,
    currentPage: data?.page ?? 1,
    totalPages: data?.pages ?? 1,
    isLoading,
    isError,
    menuState,
    closeMenu,

    getRowProps: (product) => getRowProps({
      onActivate: () => router.push(PRODUCT_DETAIL_ROUTE(product.id)),
      menuTitle: product.name,
      items: [
        { label: PRODUCTS_LABELS.TABLE_DELETE_TITLE, icon: UI_SYMBOLS.DELETE, onClick: () => onDelete(product.id, product.name), variant: 'danger' as const },
      ],
    }),

    onPageChange: (page) => setFilters((prev) => ({ ...prev, page })),
    formatAmount: formatCurrency,
    emptyIcon: ROUTE_ICONS.PRODUCTS,
    emptyValue: UI_SYMBOLS.EM_DASH,
  }
}
