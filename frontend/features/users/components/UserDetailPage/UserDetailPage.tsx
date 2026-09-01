'use client'
import type { ReactElement } from 'react'
import { useUserDetailPage } from './useUserDetailPage'
import { RecordDetailHeader } from '@/shared/components/RecordDetailHeader/RecordDetailHeader'
import { InlineEditField } from '@/shared/components/InlineEditField/InlineEditField'
import { InlineSelectField } from '@/shared/components/InlineSelectField/InlineSelectField'
import { PageSkeleton } from '@/shared/components/PageSkeleton/PageSkeleton'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary/ErrorBoundary'
import { UI_LABELS } from '@/shared/constants/uiLabels'
import { ROUTES } from '@/shared/constants/routes'
import styles from './UserDetailPage.module.scss'
import type { UserDetailPageProps } from './useUserDetailPage'

export { type UserDetailPageProps }

export const UserDetailPage = (props: UserDetailPageProps): ReactElement => {
  const {
    user, isLoading, isError, refetch,
    backLabel, menuTitle, menuItems,
    sectionInfoLabel, labelName, labelEmail, labelRole, labelStatus,
    isOwnRow, isAdmin, roleOptions, currentRole, currentRoleLabel, formattedStatus,
    onSaveName, onRoleChange, noop,
  } = useUserDetailPage(props)

  if (isLoading) return <PageSkeleton rows={6} />
  if (isError || !user) {
    return <ErrorBoundary message={UI_LABELS.ERROR_LOADING_USER_DETAIL} onReset={refetch} />
  }

  return (
    <div className={styles.page}>
      <RecordDetailHeader
        title={user.full_name}
        backLabel={backLabel}
        backHref={ROUTES.USERS}
        menuTitle={menuTitle}
        menuItems={menuItems}
      />
      <div className={styles.body}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{sectionInfoLabel}</h2>
          <div className={styles.fieldsGrid}>
            <InlineEditField label={labelName} value={user.full_name} type="text" editable={isOwnRow} onSave={onSaveName} />
            {/* email is the account identity — never editable by anyone, including admins */}
            <InlineEditField label={labelEmail} value={user.email} type="text" editable={false} onSave={noop} />
            {isAdmin ? (
              <InlineSelectField label={labelRole} value={currentRole} options={roleOptions} onChange={onRoleChange} />
            ) : (
              <div className={styles.readOnlyCard}>
                <span className={styles.readOnlyLabel}>{labelRole}</span>
                <span className={styles.readOnlyValue}>{currentRoleLabel}</span>
              </div>
            )}
            <div className={styles.readOnlyCard}>
              <span className={styles.readOnlyLabel}>{labelStatus}</span>
              <span className={styles.readOnlyValue}>{formattedStatus}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
