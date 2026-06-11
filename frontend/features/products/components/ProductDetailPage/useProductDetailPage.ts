'use client'
import { useRouter } from 'next/navigation'
import { useSetAtom } from 'jotai'
import { ROUTES } from '@/shared/constants/routes'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import { PRODUCTS_LABELS } from '../../constants/productsLabels'
import { useProduct, useDeleteProduct } from '../../queries/useProducts'
import { confirmDialogAtom } from '@/shared/store/globalAtoms'
import { isProductFormOpenAtom, editingProductIdAtom } from '../../store/productsAtoms'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import type { DetailSection } from '@/shared/components/DetailLayout/useDetailLayout'

export interface ProductDetailPageProps {
  productId: string
}

export interface UseProductDetailPageReturn {
  title: string
  backLabel: string
  onBack: () => void
  editLabel: string
  onEdit: () => void
  deleteLabel: string
  onDelete: () => void
  sections: DetailSection[]
  isLoading: boolean
  isError: boolean
  errorMessage: string
}

export const useProductDetailPage = (props: ProductDetailPageProps): UseProductDetailPageReturn => {
  const router = useRouter()
  const setConfirmDialog = useSetAtom(confirmDialogAtom)
  const setEditingId = useSetAtom(editingProductIdAtom)
  const setFormOpen = useSetAtom(isProductFormOpenAtom)
  const { data, isLoading, isError } = useProduct(props.productId)
  const { mutate: deleteProduct } = useDeleteProduct()

  const onBack = (): void => router.push(ROUTES.PRODUCTS)

  const onEdit = (): void => {
    setEditingId(props.productId)
    setFormOpen(true)
  }

  const onDelete = (): void => {
    setConfirmDialog({
      isOpen: true,
      options: {
        message: PRODUCTS_LABELS.DETAIL_DELETE_MSG,
        isDangerous: true,
        onConfirm: () =>
          deleteProduct(props.productId, {
            onSuccess: () => router.push(ROUTES.PRODUCTS),
          }),
      },
    })
  }

  const statusLabel = data
    ? data.is_active
      ? PRODUCTS_LABELS.ACTIVE_LABEL
      : PRODUCTS_LABELS.INACTIVE_LABEL
    : UI_LABELS.NOT_SET

  const sections: DetailSection[] = data
    ? [
        {
          fields: [
            { label: PRODUCTS_LABELS.COL_NAME, value: data.name },
            { label: PRODUCTS_LABELS.DETAIL_CATEGORY, value: data.category?.name ?? UI_LABELS.NOT_SET },
            { label: PRODUCTS_LABELS.DETAIL_PRICE, value: formatCurrency(data.base_price) },
            { label: PRODUCTS_LABELS.DETAIL_COST, value: formatCurrency(data.base_cost) },
            {
              label: PRODUCTS_LABELS.DETAIL_PROD_DAYS,
              value: data.avg_production_days !== null ? String(data.avg_production_days) : UI_LABELS.NOT_SET,
            },
            { label: PRODUCTS_LABELS.DETAIL_STATUS, value: statusLabel },
            { label: PRODUCTS_LABELS.DETAIL_CREATED_AT, value: formatDate(data.created_at) },
          ],
        },
      ]
    : []

  return {
    title: data?.name ?? PRODUCTS_LABELS.DETAIL_TITLE,
    backLabel: UI_LABELS.BACK_TO_LIST,
    onBack,
    editLabel: UI_LABELS.EDIT,
    onEdit,
    deleteLabel: UI_LABELS.DELETE,
    onDelete,
    sections,
    isLoading,
    isError,
    errorMessage: UI_LABELS.ERROR_LOADING_PRODUCT_DETAIL,
  }
}
