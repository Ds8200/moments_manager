'use client'
import { useRef } from 'react'
import type { ChangeEvent, RefObject } from 'react'
import { useMyOrg, useUploadLogo } from '../../../queries/useOrganizations'
import { ORG_SETTINGS_LABELS } from '../../../constants/orgSettingsLabels'

export interface ColorEntry {
  key: string
  label: string
  hex: string
}

export interface UseOrgLogoCardReturn {
  fileInputRef: RefObject<HTMLInputElement | null>
  sectionTitle: string
  subtitle: string
  currentLogoLabel: string
  logoPath: string | null
  noLogoLabel: string
  changeLogoBtnLabel: string
  uploadingLabel: string
  uploadHint: string
  isUploading: boolean
  colorEntries: ColorEntry[]
  onSelectClick: () => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
}

export const useOrgLogoCard = (): UseOrgLogoCardReturn => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: org } = useMyOrg()
  const uploadLogo = useUploadLogo()

  const brandColors = uploadLogo.data?.brand_colors ?? org?.brand_colors ?? null
  const logoPath = uploadLogo.data?.logo_path ?? org?.logo_path ?? null

  const colorEntries: ColorEntry[] = brandColors
    ? [
        { key: 'primary', label: ORG_SETTINGS_LABELS.COLOR_PRIMARY, hex: brandColors.primary },
        { key: 'secondary', label: ORG_SETTINGS_LABELS.COLOR_SECONDARY, hex: brandColors.secondary },
        { key: 'accent', label: ORG_SETTINGS_LABELS.COLOR_ACCENT, hex: brandColors.accent },
        { key: 'background', label: ORG_SETTINGS_LABELS.COLOR_BACKGROUND, hex: brandColors.background },
        { key: 'text', label: ORG_SETTINGS_LABELS.COLOR_TEXT, hex: brandColors.text },
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

  return {
    fileInputRef,
    sectionTitle: ORG_SETTINGS_LABELS.LOGO_SECTION_TITLE,
    subtitle: ORG_SETTINGS_LABELS.LOGO_SECTION_SUBTITLE,
    currentLogoLabel: ORG_SETTINGS_LABELS.CURRENT_LOGO_LABEL,
    logoPath,
    noLogoLabel: ORG_SETTINGS_LABELS.NO_LOGO,
    changeLogoBtnLabel: ORG_SETTINGS_LABELS.CHANGE_LOGO_BUTTON,
    uploadingLabel: ORG_SETTINGS_LABELS.UPLOADING,
    uploadHint: ORG_SETTINGS_LABELS.UPLOAD_HINT,
    isUploading: uploadLogo.isPending,
    colorEntries,
    onSelectClick,
    onFileChange,
  }
}
