'use client'
import type { ReactElement } from 'react'
import { useOrgSettings } from './useOrgSettings'
import { OrgNameForm } from './OrgNameForm/OrgNameForm'
import { OrgLogoCard } from './OrgLogoCard/OrgLogoCard'
import { OrgMembersSection } from './OrgMembersSection/OrgMembersSection'
import { OrgIntegrationsSection } from './OrgIntegrationsSection/OrgIntegrationsSection'
import { OrgPasswordSection } from './OrgPasswordSection/OrgPasswordSection'
import styles from './OrgSettings.module.scss'

export const OrgSettings = (): ReactElement => {
  const { pageTitle } = useOrgSettings()

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{pageTitle}</h1>
      <div className={styles.sections}>
        <OrgNameForm />
        <OrgLogoCard />
        <OrgIntegrationsSection />
        <OrgPasswordSection />
        <OrgMembersSection />
      </div>
    </div>
  )
}
