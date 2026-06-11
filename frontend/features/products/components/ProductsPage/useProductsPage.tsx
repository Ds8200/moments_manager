'use client'
import { useCallback, type MouseEvent } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { useProducts, useDeleteProduct } from '../../queries/useProducts'
import { productFiltersAtom, isProductFormOpenAtom, editingProductIdAtom } from '../../store/productsAtoms'
import { formatCurrency } from '@/shared/utils/formatters'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { useDropdownMenu } from '@/shared/components/DropdownMenu/useDropdownMenu'
import { PRODUCTS_LABELS } from '../../constants/productsLabels'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import { PRODUCT_DETAIL_ROUTE, ROUTE_ICONS } from '@/shared/constants/routes'
import type { DropdownMenuState } from '@/shared/components/DropdownMenu/useDropdownMenu'
import type { TableColumn, PaginationLabels } from '@/shared/components/DataTable/useDataTable'
import type { FiltersBarProps } from '@/shared/components/FiltersBar/useFiltersBar'
import type { Product, ProductFilters } from '../../types'
import styles from './ProductsPage.module.scss'

export interface UseProductsPageReturn {
  title: string
  actionLabel: string
  onAction: () => void
  filtersBarProps: FiltersBarProps
  columns: TableColumn<Product>[]
  rows: Product[]
  isLoading: boolean
  isError: boolean
  emptyTitle: string
  emptyDescription: string
  emptyIcon: string
  errorTitle: string
  currentPage: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
  paginationLabels: PaginationLabels
  onRowLeftClick: (product: Product) => void
  onRowRightClick: (product: Product, e: MouseEvent<HTMLTableRowElement>) => void
  menuState: DropdownMenuState
  closeMenu: () => void
}

export const useProductsPage = (): UseProductsPageReturn => {
  const [filters, setFilters] = useAtom(productFiltersAtom)
  const setFormOpen = useSetAtom(isProductFormOpenAtom)
  const setEditingId = useSetAtom(editingProductIdAtom)
  const router = useRouter()
  const deleteProduct = useDeleteProduct()
  const confirm = useConfirm()
  const { menuState, openMenu, closeMenu } = useDropdownMenu()

  const { data, isLoading, isError } = useProducts(filters.page, filters.search, filters.is_active)

  const patch = useCallback(
    (p: Partial<ProductFilters>) => setFilters((prev) => ({ ...prev, ...p, page: 1 })),
    [setFilters],
  )

  const onDelete = (id: string, name: string): void => {
    confirm({
      message: `${PRODUCTS_LABELS.CONFIRM_DELETE} ${name}?`,
      isDangerous: true,
      onConfirm: () => deleteProduct.mutate(id),
    })
  }

  const isActiveValue = filters.is_active === null ? '' : String(filters.is_active)

  const columns: TableColumn<Product>[] = [
    {
      key: 'name',
      header: PRODUCTS_LABELS.COL_NAME,
      cell: (p) => <span className={styles.name}>{p.name}</span>,
    },
    {
      key: 'category',
      header: PRODUCTS_LABELS.COL_CATEGORY,
      cell: (p) => <span className={styles.secondary}>{p.category?.name ?? UI_SYMBOLS.EM_DASH}</span>,
    },
    {
      key: 'base_price',
      header: PRODUCTS_LABELS.COL_PRICE,
      cell: (p) => <span className={styles.price}>{formatCurrency(p.base_price)}</span>,
    },
    {
      key: 'base_cost',
      header: PRODUCTS_LABELS.COL_COST,
      cell: (p) => <span className={styles.secondary}>{formatCurrency(p.base_cost)}</span>,
    },
    {
      key: 'status',
      header: PRODUCTS_LABELS.COL_STATUS,
      cell: (p) => (
        <span className={p.is_active ? styles.activeBadge : styles.inactiveBadge}>
          {p.is_active ? PRODUCTS_LABELS.ACTIVE_LABEL : PRODUCTS_LABELS.INACTIVE_LABEL}
        </span>
      ),
    },
  ]

  return {
    title: PRODUCTS_LABELS.PAGE_TITLE,
    actionLabel: PRODUCTS_LABELS.NEW_PRODUCT,
    onAction: () => {
      setEditingId(null)
      setFormOpen(true)
    },
    filtersBarProps: {
      searchValue: filters.search,
      searchPlaceholder: PRODUCTS_LABELS.SEARCH_PLACEHOLDER,
      onSearchChange: (v) => patch({ search: v }),
      selects: [
        {
          value: isActiveValue,
          options: [
            { value: '',      label: PRODUCTS_LABELS.ALL_STATUSES },
            { value: 'true',  label: PRODUCTS_LABELS.ACTIVE_ONLY },
            { value: 'false', label: PRODUCTS_LABELS.INACTIVE_ONLY },
          ],
          onChange: (v: string) => {
            const parsed = v === '' ? null : v === 'true'
            patch({ is_active: parsed })
          },
        },
      ],
    },
    columns,
    rows: data?.items ?? [],
    isLoading,
    isError,
    emptyTitle: PRODUCTS_LABELS.EMPTY_TITLE,
    emptyDescription: PRODUCTS_LABELS.EMPTY_DESC,
    emptyIcon: ROUTE_ICONS.PRODUCTS,
    errorTitle: PRODUCTS_LABELS.ERROR_LOAD,
    currentPage: data?.page ?? 1,
    totalPages: data?.pages ?? 1,
    total: data?.total ?? 0,
    onPageChange: (page) => setFilters((prev) => ({ ...prev, page })),
    paginationLabels: {
      totalPrefix: PRODUCTS_LABELS.TABLE_TOTAL,
      totalSuffix: PRODUCTS_LABELS.TABLE_PRODUCTS_SUFFIX,
      prev: PRODUCTS_LABELS.TABLE_PREV,
      next: PRODUCTS_LABELS.TABLE_NEXT,
    },
    onRowLeftClick: (product) => router.push(PRODUCT_DETAIL_ROUTE(product.id)),
    onRowRightClick: (product, e) => {
      openMenu(product.name, [
        { label: PRODUCTS_LABELS.TABLE_EDIT_TITLE, icon: UI_SYMBOLS.EDIT, onClick: () => { setEditingId(product.id); setFormOpen(true) } },
        { label: PRODUCTS_LABELS.TABLE_DELETE_TITLE, icon: UI_SYMBOLS.DELETE, onClick: () => onDelete(product.id, product.name), variant: 'danger' },
      ], e)
    },
    menuState,
    closeMenu,
  }
}
