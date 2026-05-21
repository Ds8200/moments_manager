import type { Metadata } from 'next'
import { CustomersPage } from '@/features/customers/components/CustomersPage/CustomersPage'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.CUSTOMERS_TITLE }

export default function Page() {
  return <CustomersPage />
}
