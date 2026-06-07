'use client'
import { ORG_SETTINGS_LABELS } from '../../constants/orgSettingsLabels'

export interface UseOrgSettingsReturn {
  pageTitle: string
}

export const useOrgSettings = (): UseOrgSettingsReturn => {
  return { pageTitle: ORG_SETTINGS_LABELS.PAGE_TITLE }
}
