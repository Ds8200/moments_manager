'use client'
import { SYSTEM_SETTINGS_LABELS } from '../../constants/systemSettingsLabels'

export interface UseSystemSettingsPageReturn {
  pageTitle: string
}

export const useSystemSettingsPage = (): UseSystemSettingsPageReturn => ({
  pageTitle: SYSTEM_SETTINGS_LABELS.PAGE_TITLE,
})
