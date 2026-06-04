'use client'
import type { Recipient } from '../../../../types'

export interface RecipientChipsProps {
  recipients: Recipient[]
  onRemove: (key: string) => void
}

export interface UseRecipientChipsReturn {
  recipients: Recipient[]
  onRemove: (key: string) => void
}

export const useRecipientChips = ({ recipients, onRemove }: RecipientChipsProps): UseRecipientChipsReturn => ({
  recipients,
  onRemove,
})
