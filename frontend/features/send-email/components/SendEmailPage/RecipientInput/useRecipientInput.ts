'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAllCustomersWithEmail } from '@/features/customers/queries/useCustomers'
import type { Customer } from '@/features/customers/types'
import type { Recipient } from '../../../types'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface UseRecipientInputProps {
  recipients: Recipient[]
  onToggle: (customer: Customer) => void
  onSelectAll: (customers: Customer[]) => void
  onClearAll: () => void
  onAddManual: (email: string) => void
  onRemoveRecipient: (key: string) => void
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
  onRemoveRecipient: (key: string) => void
  manualInput: string
  onManualInputChange: (val: string) => void
  onAddManual: () => void
  onManualKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  manualError: string | undefined
  isListOpen: boolean
  toggleList: () => void
}

export const useRecipientInput = ({
  recipients,
  onToggle,
  onSelectAll,
  onClearAll,
  onAddManual: propOnAddManual,
  onRemoveRecipient,
}: UseRecipientInputProps): UseRecipientInputReturn => {
  const { data, isLoading } = useAllCustomersWithEmail()
  const customers: Customer[] = (data?.items ?? []).filter((c) => !!c.email && c.email.trim() !== '')

  const selectedCount = customers.filter((c) =>
    recipients.some((r) => r.customer_id === c.id),
  ).length
  const isAllSelected = customers.length > 0 && selectedCount === customers.length
  const isIndeterminate = selectedCount > 0 && selectedCount < customers.length

  const selectAllRef = useRef<HTMLInputElement | null>(null)
  const [manualInput, setManualInput] = useState('')
  const [manualError, setManualError] = useState<string | undefined>()
  const [isListOpen, setIsListOpen] = useState(false)

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isIndeterminate
    }
  }, [isIndeterminate])

  const isCustomerSelected = useCallback(
    (id: string) => recipients.some((r) => r.customer_id === id),
    [recipients],
  )

  const handleSelectAll = useCallback(() => { onSelectAll(customers) }, [customers, onSelectAll])
  const toggleList = useCallback(() => setIsListOpen((v) => !v), [])

  const onManualInputChange = useCallback((val: string) => {
    setManualInput(val)
    if (manualError) setManualError(undefined)
  }, [manualError])

  const onAddManual = useCallback(() => {
    const trimmed = manualInput.trim()
    if (!EMAIL_REGEX.test(trimmed)) {
      setManualError('כתובת מייל לא תקינה')
      return
    }
    propOnAddManual(trimmed)
    setManualInput('')
    setManualError(undefined)
  }, [manualInput, propOnAddManual])

  const onManualKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onAddManual()
      }
    },
    [onAddManual],
  )

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
    onRemoveRecipient,
    manualInput,
    onManualInputChange,
    onAddManual,
    onManualKeyDown,
    manualError,
    isListOpen,
    toggleList,
  }
}
