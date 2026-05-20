import type { Metadata } from 'next'
import { CustomersPage } from '@/features/customers/components/CustomersPage/CustomersPage'

export const metadata: Metadata = { title: 'לקוחות — Moments' }

export default function Page() {
  return <CustomersPage />
}
