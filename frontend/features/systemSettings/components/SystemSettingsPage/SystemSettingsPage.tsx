'use client'
import type { ReactElement } from 'react'
import { useSystemSettingsPage } from './useSystemSettingsPage'
import { SystemSmtpSection } from './SystemSmtpSection/SystemSmtpSection'
import { SystemOpenAISection } from './SystemOpenAISection/SystemOpenAISection'
import { SysAdminPasswordSection } from './SysAdminPasswordSection/SysAdminPasswordSection'
import styles from './SystemSettingsPage.module.scss'

export const SystemSettingsPage = (): ReactElement => {
  const { pageTitle } = useSystemSettingsPage()

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{pageTitle}</h1>
      <div className={styles.sections}>
        <SystemSmtpSection />
        <SystemOpenAISection />
        <SysAdminPasswordSection />
      </div>
    </div>
  )
}
