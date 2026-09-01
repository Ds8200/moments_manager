'use client'
import { useRouter } from 'next/navigation'
import { useCustomer, useUpdateCustomer, useDeleteCustomer } from '../../queries/useCustomers'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { ROUTES } from '@/shared/constants/routes'
import { CUSTOMERS_LABELS } from '../../constants/customersLabels'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import { formatCurrency } from '@/shared/utils/formatters'
import type { DropdownMenuItem } from '@/shared/components/DropdownMenu/useDropdownMenu'
import type { CustomerDetail } from '../../types'

export interface CustomerDetailPageProps {
  customerId: string
}

export interface UseCustomerDetailPageReturn {
  customer: CustomerDetail | undefined
  isLoading: boolean
  isError: boolean
  refetch: () => void
  backLabel: string
  menuTitle: string
  menuItems: DropdownMenuItem[]
  sectionInfoLabel: string
  sectionStatsLabel: string
  labelName: string
  labelPhone: string
  labelEmail: string
  labelNotes: string
  labelTotalOrders: string
  labelTotalSpent: string
  formattedTotalSpent: string
  onSaveName: (v: string) => void
  onSavePhone: (v: string) => void
  onSaveEmail: (v: string) => void
  onSaveNotes: (v: string) => void
}

export const useCustomerDetailPage = (props: CustomerDetailPageProps): UseCustomerDetailPageReturn => {
  const { customerId } = props
  const router = useRouter()
  const { data: customer, isLoading, isError, refetch } = useCustomer(customerId)
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()
  const confirm = useConfirm()

  const onEmail = (): void => {
    router.push(ROUTES.SEND_EMAIL + '?customerId=' + customerId)
  }

  const onDelete = (): void => {
    confirm({
      message: `${CUSTOMERS_LABELS.CONFIRM_DELETE} ${customer?.name ?? ''}?`,
      isDangerous: true,
      onConfirm: () =>
        deleteCustomer.mutate(customerId, {
          onSuccess: () => router.push(ROUTES.CUSTOMERS),
        }),
    })
  }

  const menuItems: DropdownMenuItem[] = [
    ...(customer?.email ? [{ label: UI_LABELS.EMAIL_ACTION, icon: UI_SYMBOLS.EDIT, onClick: onEmail }] : []),
    { label: CUSTOMERS_LABELS.TABLE_DELETE_TITLE, icon: UI_SYMBOLS.DELETE, onClick: onDelete, variant: 'danger' as const },
  ]

  const save = (field: 'name' | 'phone' | 'email' | 'notes') => (value: string): void => {
    updateCustomer.mutate({ id: customerId, payload: { [field]: value } })
  }

  return {
    customer,
    isLoading,
    isError,
    refetch,

    backLabel: CUSTOMERS_LABELS.DETAIL_PAGE_BACK,
    menuTitle: customer?.name ?? '',
    menuItems,

    sectionInfoLabel: CUSTOMERS_LABELS.DETAIL_SECTION_INFO,
    sectionStatsLabel: CUSTOMERS_LABELS.DETAIL_SECTION_STATS,
    labelName: CUSTOMERS_LABELS.DETAIL_LABEL_NAME,
    labelPhone: CUSTOMERS_LABELS.DETAIL_LABEL_PHONE,
    labelEmail: CUSTOMERS_LABELS.DETAIL_LABEL_EMAIL,
    labelNotes: CUSTOMERS_LABELS.DETAIL_LABEL_NOTES,
    labelTotalOrders: CUSTOMERS_LABELS.DETAIL_LABEL_TOTAL_ORDERS,
    labelTotalSpent: CUSTOMERS_LABELS.DETAIL_LABEL_TOTAL_SPENT,
    formattedTotalSpent: customer ? formatCurrency(customer.total_spent) : '',

    onSaveName: save('name'),
    onSavePhone: save('phone'),
    onSaveEmail: save('email'),
    onSaveNotes: save('notes'),
  }
}
