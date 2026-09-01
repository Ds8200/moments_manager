'use client'
import { useRouter } from 'next/navigation'
import { useProduct, useUpdateProduct, useDeleteProduct } from '../../queries/useProducts'
import { useProductCategories } from '@/features/productCategories'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { ROUTES } from '@/shared/constants/routes'
import { PRODUCTS_LABELS } from '../../constants/productsLabels'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import type { DropdownMenuItem } from '@/shared/components/DropdownMenu/useDropdownMenu'
import type { Product } from '../../types'

export interface ProductDetailPageProps {
  productId: string
}

export interface SelectOption {
  value: string
  label: string
}

export interface UseProductDetailPageReturn {
  product: Product | undefined
  isLoading: boolean
  isError: boolean
  refetch: () => void
  backLabel: string
  menuTitle: string
  menuItems: DropdownMenuItem[]
  sectionInfoLabel: string
  labelName: string
  labelCategory: string
  labelPrice: string
  labelCost: string
  labelProdDays: string
  labelStatus: string
  categoryOptions: SelectOption[]
  statusOptions: SelectOption[]
  currentCategoryId: string
  currentStatus: string
  onSaveName: (v: string) => void
  onSavePrice: (v: string) => void
  onSaveCost: (v: string) => void
  onSaveProdDays: (v: string) => void
  onCategoryChange: (v: string) => void
  onStatusChange: (v: string) => void
}

export const useProductDetailPage = (props: ProductDetailPageProps): UseProductDetailPageReturn => {
  const { productId } = props
  const router = useRouter()
  const { data: product, isLoading, isError, refetch } = useProduct(productId)
  const { data: categories = [] } = useProductCategories()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()
  const confirm = useConfirm()

  const onDelete = (): void => {
    confirm({
      message: `${PRODUCTS_LABELS.CONFIRM_DELETE} ${product?.name ?? ''}?`,
      isDangerous: true,
      onConfirm: () =>
        deleteProduct.mutate(productId, {
          onSuccess: () => router.push(ROUTES.PRODUCTS),
        }),
    })
  }

  const menuItems: DropdownMenuItem[] = [
    { label: PRODUCTS_LABELS.TABLE_DELETE_TITLE, icon: UI_SYMBOLS.DELETE, onClick: onDelete, variant: 'danger' as const },
  ]

  const save = (field: 'name' | 'base_price' | 'base_cost' | 'avg_production_days') => (value: string): void => {
    const payload = field === 'avg_production_days'
      ? { avg_production_days: value === '' ? null : Number(value) }
      : { [field]: value }
    updateProduct.mutate({ id: productId, payload })
  }

  const categoryOptions: SelectOption[] = [
    { value: '', label: PRODUCTS_LABELS.DETAIL_NO_CATEGORY },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]

  const statusOptions: SelectOption[] = [
    { value: 'true', label: PRODUCTS_LABELS.ACTIVE_LABEL },
    { value: 'false', label: PRODUCTS_LABELS.INACTIVE_LABEL },
  ]

  return {
    product,
    isLoading,
    isError,
    refetch,

    backLabel: PRODUCTS_LABELS.DETAIL_PAGE_BACK,
    menuTitle: product?.name ?? '',
    menuItems,

    sectionInfoLabel: PRODUCTS_LABELS.DETAIL_SECTION_INFO,
    labelName: PRODUCTS_LABELS.DETAIL_LABEL_NAME,
    labelCategory: PRODUCTS_LABELS.DETAIL_LABEL_CATEGORY,
    labelPrice: PRODUCTS_LABELS.DETAIL_LABEL_PRICE,
    labelCost: PRODUCTS_LABELS.DETAIL_LABEL_COST,
    labelProdDays: PRODUCTS_LABELS.DETAIL_LABEL_PROD_DAYS,
    labelStatus: PRODUCTS_LABELS.DETAIL_LABEL_STATUS,

    categoryOptions,
    statusOptions,
    currentCategoryId: product?.category_id ?? '',
    currentStatus: product ? String(product.is_active) : 'true',

    onSaveName: save('name'),
    onSavePrice: save('base_price'),
    onSaveCost: save('base_cost'),
    onSaveProdDays: save('avg_production_days'),

    onCategoryChange: (v) => updateProduct.mutate({ id: productId, payload: { category_id: v || undefined } }),
    onStatusChange: (v) => updateProduct.mutate({ id: productId, payload: { is_active: v === 'true' } }),
  }
}
