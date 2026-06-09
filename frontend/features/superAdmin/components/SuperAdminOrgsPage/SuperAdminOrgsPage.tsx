'use client'
import type { ReactElement } from 'react'
import { useSuperAdminOrgsPage } from './useSuperAdminOrgsPage'
import { OrgsTab } from '../OrgsTab/OrgsTab'
import { UsersTab } from '../UsersTab/UsersTab'
import { OrgFormModal } from '../OrgFormModal/OrgFormModal'
import styles from './SuperAdminOrgsPage.module.scss'

export const SuperAdminOrgsPage = (): ReactElement => {
  const { activeTab, setActiveTab, tabBusinesses, tabUsers } = useSuperAdminOrgsPage()

  return (
    <div className={styles.page}>
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab}${activeTab === 0 ? ` ${styles.active}` : ''}`}
          onClick={() => setActiveTab(0)}
        >
          {tabBusinesses}
        </button>
        <button
          type="button"
          className={`${styles.tab}${activeTab === 1 ? ` ${styles.active}` : ''}`}
          onClick={() => setActiveTab(1)}
        >
          {tabUsers}
        </button>
      </div>

      {activeTab === 0 ? <OrgsTab /> : <UsersTab />}
      <OrgFormModal />
    </div>
  )
}
