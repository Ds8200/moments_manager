'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useOrgOwners } from '../../../queries/useOrgOwners'
import type { OrgOwnerEmail, OrgOwnerRecipient } from '../../../types'
import { SYSTEM_EMAIL_LABELS } from '../../../constants/systemEmailLabels'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface UseOrgOwnerRecipientInputProps {
  recipients: OrgOwnerRecipient[]
  onToggle: (owner: OrgOwnerEmail) => void
  onSelectAll: (owners: OrgOwnerEmail[]) => void
  onClearAll: () => void
  onAddManual: (email: string) => void
  onRemoveRecipient: (key: string) => void
}

export interface UseOrgOwnerRecipientInputReturn {
  owners: OrgOwnerEmail[]
  isLoading: boolean
  isOwnerSelected: (userId: string) => boolean
  isAllSelected: boolean
  isIndeterminate: boolean
  selectAllRef: React.RefObject<HTMLInputElement | null>
  onToggle: (owner: OrgOwnerEmail) => void
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

export const useOrgOwnerRecipientInput = ({
  recipients,
  onToggle,
  onSelectAll,
  onClearAll,
  onAddManual: propOnAddManual,
  onRemoveRecipient,
}: UseOrgOwnerRecipientInputProps): UseOrgOwnerRecipientInputReturn => {
  const { data, isLoading } = useOrgOwners()
  const owners = useMemo<OrgOwnerEmail[]>(() => data ?? [], [data])

  const selectedCount = owners.filter((o) =>
    recipients.some((r) => r.user_id === o.user_id),
  ).length
  const isAllSelected = owners.length > 0 && selectedCount === owners.length
  const isIndeterminate = selectedCount > 0 && selectedCount < owners.length

  const selectAllRef = useRef<HTMLInputElement | null>(null)
  const [manualInput, setManualInput] = useState('')
  const [manualError, setManualError] = useState<string | undefined>()
  const [isListOpen, setIsListOpen] = useState(false)

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isIndeterminate
    }
  }, [isIndeterminate])

  const isOwnerSelected = useCallback(
    (userId: string) => recipients.some((r) => r.user_id === userId),
    [recipients],
  )

  const handleSelectAll = useCallback(() => { onSelectAll(owners) }, [owners, onSelectAll])
  const toggleList = useCallback(() => setIsListOpen((v) => !v), [])

  const onManualInputChange = useCallback((val: string) => {
    setManualInput(val)
    if (manualError) setManualError(undefined)
  }, [manualError])

  const onAddManual = useCallback(() => {
    const trimmed = manualInput.trim()
    if (!EMAIL_REGEX.test(trimmed)) {
      setManualError(SYSTEM_EMAIL_LABELS.MANUAL_EMAIL_INVALID)
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
    owners,
    isLoading,
    isOwnerSelected,
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
