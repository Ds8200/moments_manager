'use client'
import { useRef } from 'react'
import type { ChangeEvent, RefObject } from 'react'
import { useUploadLogo } from '../../../queries/useOrganizations'
import { ONBOARDING_LABELS } from '../../../constants/onboardingLabels'

export interface LogoStepProps {
  onNext: () => void
}

export interface ColorEntry {
  key: string
  label: string
  hex: string
}

export interface UseLogoStepReturn {
  fileInputRef: RefObject<HTMLInputElement | null>
  isUploading: boolean
  colorEntries: ColorEntry[]
  canProceed: boolean
  onSelectClick: () => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onNextClick: () => void
}

export const useLogoStep = ({ onNext }: LogoStepProps): UseLogoStepReturn => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadLogo = useUploadLogo()
  const brandColors = uploadLogo.data?.brand_colors ?? null

  const colorEntries: ColorEntry[] = brandColors
    ? [
        { key: 'primary', label: ONBOARDING_LABELS.COLOR_PRIMARY, hex: brandColors.primary },
        { key: 'secondary', label: ONBOARDING_LABELS.COLOR_SECONDARY, hex: brandColors.secondary },
        { key: 'accent', label: ONBOARDING_LABELS.COLOR_ACCENT, hex: brandColors.accent },
        { key: 'background', label: ONBOARDING_LABELS.COLOR_BACKGROUND, hex: brandColors.background },
        { key: 'text', label: ONBOARDING_LABELS.COLOR_TEXT, hex: brandColors.text },
      ]
    : []

  const onSelectClick = (): void => {
    fileInputRef.current?.click()
  }

  const onFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (file) uploadLogo.mutate(file)
    event.target.value = ''
  }

  const onNextClick = (): void => {
    onNext()
  }

  return {
    fileInputRef,
    isUploading: uploadLogo.isPending,
    colorEntries,
    canProceed: uploadLogo.isSuccess,
    onSelectClick,
    onFileChange,
    onNextClick,
  }
}
