'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAtomValue, useSetAtom } from 'jotai'
import { emailDraftAtom, setEmailDraftAtom } from '@/features/ai/store/aiAtoms'
import type { EmailDraft } from '@/features/ai/store/aiAtoms'
import { ROUTES } from '@/shared/constants/routes'

export interface UseAiEmailDraftCtaReturn {
  draft: EmailDraft | null
  handleSend: () => void
}

export const useAiEmailDraftCta = (): UseAiEmailDraftCtaReturn => {
  const draft = useAtomValue(emailDraftAtom)
  const setDraft = useSetAtom(setEmailDraftAtom)
  const router = useRouter()

  const handleSend = useCallback((): void => {
    if (!draft) return
    const params = new URLSearchParams()
    if (draft.is_bulk) {
      params.set('selectAll', 'true')
    } else if (draft.customer_id) {
      params.set('customerId', draft.customer_id)
    }
    params.set('subject', draft.subject)
    params.set('body', draft.body_text)
    setDraft(null)
    router.push(`${ROUTES.SEND_EMAIL}?${params.toString()}`)
  }, [draft, setDraft, router])

  return { draft, handleSend }
}
