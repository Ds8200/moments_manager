'use client'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary/ErrorBoundary'
import { UI_LABELS } from '@/shared/constants/uiLabels'

export default function NewOrgError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorBoundary message={UI_LABELS.ERROR_LOADING_CREATE_ORG} onReset={reset} />
}
