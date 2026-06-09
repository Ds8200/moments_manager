'use client'
import type { ReactElement } from 'react'
import Link from 'next/link'
import { ROUTES } from '@/shared/constants/routes'
import { useOrgDetail } from './useOrgDetail'
import type { OrgDetailProps } from './useOrgDetail'
import { OrgEditForm } from './OrgEditForm/OrgEditForm'
import styles from './OrgDetail.module.scss'

export type { OrgDetailProps }

export const OrgDetail = (props: OrgDetailProps): ReactElement => {
  const {
    org,
    isEditing,
    planLabel,
    formattedDate,
    formattedTrialDate,
    onEdit,
    editFormProps,
    labels,
  } = useOrgDetail(props)

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>{org.name}</h1>
        <div className={styles.headerActions}>
          {!isEditing && (
            <button onClick={onEdit} className={styles.editBtn}>{labels.editBtn}</button>
          )}
          <Link href={ROUTES.SUPER_ADMIN_ORGS} className={styles.backBtn}>{labels.back}</Link>
        </div>
      </div>

      <div className={styles.card}>
        <dl className={styles.grid}>
          <div className={styles.field}>
            <dt className={styles.label}>{labels.fieldName}</dt>
            <dd className={styles.value}>{org.name}</dd>
          </div>
          <div className={styles.field}>
            <dt className={styles.label}>{labels.fieldSlug}</dt>
            <dd className={styles.value}>{org.slug}</dd>
          </div>
          <div className={styles.field}>
            <dt className={styles.label}>{labels.fieldPlan}</dt>
            <dd className={styles.value}>{planLabel}</dd>
          </div>
          <div className={styles.field}>
            <dt className={styles.label}>{labels.fieldStatus}</dt>
            <dd className={styles.value}>
              {org.is_active ? labels.statusActive : labels.statusInactive}
            </dd>
          </div>
          <div className={styles.field}>
            <dt className={styles.label}>{labels.fieldMembers}</dt>
            <dd className={styles.value}>{org.member_count}</dd>
          </div>
          <div className={styles.field}>
            <dt className={styles.label}>{labels.fieldCreated}</dt>
            <dd className={styles.value}>{formattedDate}</dd>
          </div>
          {formattedTrialDate !== null && (
            <div className={styles.field}>
              <dt className={styles.label}>{labels.fieldTrialEnds}</dt>
              <dd className={styles.value}>{formattedTrialDate}</dd>
            </div>
          )}
          <div className={styles.field}>
            <dt className={styles.label}>{labels.fieldOwnerEmail}</dt>
            <dd className={styles.value}>{org.owner_email}</dd>
          </div>
        </dl>

        {isEditing && <OrgEditForm {...editFormProps} />}
      </div>
    </div>
  )
}
