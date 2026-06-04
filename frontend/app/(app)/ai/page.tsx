import type { Metadata } from 'next'
import { AiPage } from '@/features/ai/components/AiPage/AiPage'
import { META_LABELS } from '@/shared/constants/uiLabels'

export const metadata: Metadata = { title: META_LABELS.AI_TITLE }

export default function AiRoutePage() {
  return <AiPage />
}
