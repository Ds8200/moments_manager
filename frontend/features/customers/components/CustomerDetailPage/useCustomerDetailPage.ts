'use client'
import { useRouter } from 'next/navigation'
import { useSetAtom } from 'jotai'
import { ROUTES } from '@/shared/constants/routes'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import { CUSTOMERS_LABELS } from '../../constants/customersLabels'
import { useCustomer, useDeleteCustomer } from '../../queries/useCustomers'
import { confirmDialogAtom } from '@/shared/store/globalAtoms'
import { isCustomerFormOpenAtom, editingCustomerIdAtom } from '../../store/customersAtoms'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import type { DetailSection } from '@/shared/components/DetailLayout/useDetailLayout'

export interface CustomerDetailPageProps {
  customerId: string
}

export interface UseCustomerDetailPageReturn {
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

export const useCustomerDetailPage = (props: CustomerDetailPageProps): UseCustomerDetailPageReturn => {
  const router = useRouter()
  const setConfirmDialog = useSetAtom(confirmDialogAtom)
  const setEditingId = useSetAtom(editingCustomerIdAtom)
  const setFormOpen = useSetAtom(isCustomerFormOpenAtom)
  const { data, isLoading, isError } = useCustomer(props.customerId)
  const { mutate: deleteCustomer } = useDeleteCustomer()

  const onBack = (): void => router.push(ROUTES.CUSTOMERS)

  const onEdit = (): void => {
    setEditingId(props.customerId)
    setFormOpen(true)
  }

  const onDelete = (): void => {
    setConfirmDialog({
      isOpen: true,
      options: {
        message: CUSTOMERS_LABELS.DETAIL_DELETE_MSG,
        isDangerous: true,
        onConfirm: () =>
          deleteCustomer(props.customerId, {
            onSuccess: () => router.push(ROUTES.CUSTOMERS),
          }),
      },
    })
  }

  const sections: DetailSection[] = data
    ? [
        {
          fields: [
            { label: CUSTOMERS_LABELS.DETAIL_NAME, value: data.name },
            { label: CUSTOMERS_LABELS.DETAIL_PHONE, value: data.phone ?? UI_LABELS.NOT_SET },
            { label: CUSTOMERS_LABELS.DETAIL_EMAIL, value: data.email ?? UI_LABELS.NOT_SET },
            { label: CUSTOMERS_LABELS.DETAIL_CREATED_AT, value: formatDate(data.created_at) },
            { label: CUSTOMERS_LABELS.DETAIL_NOTES, value: data.notes ?? UI_LABELS.NOT_SET, span: 2 },
          ],
        },
        {
          title: CUSTOMERS_LABELS.DETAIL_STATS_TITLE,
          fields: [
            { label: CUSTOMERS_LABELS.DETAIL_TOTAL_ORDERS, value: String(data.total_orders) },
            { label: CUSTOMERS_LABELS.DETAIL_TOTAL_REVENUE, value: formatCurrency(data.total_revenue) },
            { label: CUSTOMERS_LABELS.DETAIL_TOTAL_PROFIT, value: formatCurrency(data.total_profit) },
          ],
        },
      ]
    : []

  return {
    title: data?.name ?? CUSTOMERS_LABELS.DETAIL_TITLE,
    backLabel: UI_LABELS.BACK_TO_LIST,
    onBack,
    editLabel: UI_LABELS.EDIT,
    onEdit,
    deleteLabel: UI_LABELS.DELETE,
    onDelete,
    sections,
    isLoading,
    isError,
    errorMessage: UI_LABELS.ERROR_LOADING_CUSTOMER_DETAIL,
  }
}
