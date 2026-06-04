'use client'
import { useState, useCallback } from 'react'
import type { AutocompleteOption } from '@/shared/components/Autocomplete/useAutocomplete'
import { useCustomers, useAllCustomersWithEmail } from '@/features/customers/queries/useCustomers'
import type { Customer } from '@/features/customers/types'
import type { Recipient } from '../../../types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface UseRecipientInputProps {
  recipients: Recipient[]
  onAdd: (r: Recipient) => void
  onRemove: (key: string) => void
  onAddAll: (rs: Recipient[]) => void
  onClearAll: () => void
}

export interface UseRecipientInputReturn {
  customerOptions: AutocompleteOption<Customer>[]
  isLoading: boolean
  isLoadingAll: boolean
  onSearch: (q: string) => void
  onCustomerSelect: (value: string | null, option: AutocompleteOption<Customer> | null) => void
  onFreeTextEmail: (text: string) => void
  autocompleteValue: string | null
  onSelectAll: () => void
  onClearAll: () => void
  isAllSelected: boolean
  hasAnyRecipients: boolean
}

export const useRecipientInput = ({
  recipients,
  onAdd,
  onRemove: _onRemove,
  onAddAll,
  onClearAll,
}: UseRecipientInputProps): UseRecipientInputReturn => {
  const [search, setSearch] = useState('')
  const [autocompleteValue, setAutocompleteValue] = useState<string | null>(null)

  const { data, isLoading } = useCustomers(1, search, 20)
  const { data: allWithEmail, isLoading: isLoadingAll } = useAllCustomersWithEmail()

  const customerOptions: AutocompleteOption<Customer>[] = (data?.items ?? [])
    .filter((c) => c.email !== null)
    .filter((c) => !recipients.some((r) => r.customer_id === c.id))
    .map((c) => ({
      value: c.id,
      label: `${c.name} (${c.email})`,
      data: c,
    }))

  const allEmailCustomers = (allWithEmail?.items ?? []).filter((c) => c.email !== null)

  const isAllSelected =
    allEmailCustomers.length > 0 &&
    allEmailCustomers.every((c) => recipients.some((r) => r.customer_id === c.id))

  const hasAnyRecipients = recipients.length > 0

  const onSearch = useCallback((q: string) => setSearch(q), [])

  const onCustomerSelect = useCallback(
    (value: string | null, option: AutocompleteOption<Customer> | null) => {
      if (!value || !option?.data?.email) return
      onAdd({
        key: `customer-${value}`,
        label: `${option.data.name} (${option.data.email})`,
        email: option.data.email,
        customer_id: value,
      })
      setAutocompleteValue(null)
      setSearch('')
    },
    [onAdd],
  )

  const onFreeTextEmail = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!EMAIL_RE.test(trimmed)) return
      if (recipients.some((r) => r.email === trimmed)) return
      onAdd({
        key: `manual-${trimmed}`,
        label: trimmed,
        email: trimmed,
      })
    },
    [onAdd, recipients],
  )

  const onSelectAll = useCallback(() => {
    const toAdd: Recipient[] = allEmailCustomers
      .filter((c) => !recipients.some((r) => r.customer_id === c.id))
      .map((c) => ({
        key: `customer-${c.id}`,
        label: `${c.name} (${c.email})`,
        email: c.email!,
        customer_id: c.id,
      }))
    if (toAdd.length > 0) onAddAll(toAdd)
  }, [allEmailCustomers, recipients, onAddAll])

  return {
    customerOptions,
    isLoading,
    isLoadingAll,
    onSearch,
    onCustomerSelect,
    onFreeTextEmail,
    autocompleteValue,
    onSelectAll,
    onClearAll,
    isAllSelected,
    hasAnyRecipients,
  }
}
