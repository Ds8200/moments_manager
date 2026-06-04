'use client'
import { useCallback, useEffect, useRef } from 'react'
import { useAllCustomersWithEmail } from '@/features/customers/queries/useCustomers'
import type { Customer } from '@/features/customers/types'
import type { Recipient } from '../../../types'

export interface UseRecipientInputProps {
  recipients: Recipient[]
  onToggle: (customer: Customer) => void
  onSelectAll: (customers: Customer[]) => void
  onClearAll: () => void
}

export interface UseRecipientInputReturn {
  customers: Customer[]
  isLoading: boolean
  isCustomerSelected: (id: string) => boolean
  isAllSelected: boolean
  isIndeterminate: boolean
  selectAllRef: React.RefObject<HTMLInputElement | null>
  onToggle: (customer: Customer) => void
  onSelectAll: () => void
  onClearAll: () => void
}

export const useRecipientInput = ({
  recipients,
  onToggle,
  onSelectAll,
  onClearAll,
}: UseRecipientInputProps): UseRecipientInputReturn => {
  const { data, isLoading } = useAllCustomersWithEmail()

  const customers: Customer[] = (data?.items ?? []).filter((c) => c.email !== null)

  const selectedCount = customers.filter((c) =>
    recipients.some((r) => r.customer_id === c.id),
  ).length

  const isAllSelected = customers.length > 0 && selectedCount === customers.length
  const isIndeterminate = selectedCount > 0 && selectedCount < customers.length

  const selectAllRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isIndeterminate
    }
  }, [isIndeterminate])

  const isCustomerSelected = useCallback(
    (id: string) => recipients.some((r) => r.customer_id === id),
    [recipients],
  )

  const handleSelectAll = useCallback(() => {
    onSelectAll(customers)
  }, [customers, onSelectAll])

  return {
    customers,
    isLoading,
    isCustomerSelected,
    isAllSelected,
    isIndeterminate,
    selectAllRef,
    onToggle,
    onSelectAll: handleSelectAll,
    onClearAll,
  }
}
