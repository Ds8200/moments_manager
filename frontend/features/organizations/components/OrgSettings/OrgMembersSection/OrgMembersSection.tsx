'use client'
import type { ReactElement } from 'react'
import { useOrgMembersSection } from './useOrgMembersSection'
import { InviteMemberForm } from './InviteMemberForm/InviteMemberForm'
import styles from './OrgMembersSection.module.scss'

export const OrgMembersSection = (): ReactElement => {
  const { sectionTitle, members, isLoading, isError, emptyLabel, removeLabel, onRemove } = useOrgMembersSection()

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{sectionTitle}</h2>

      {!isLoading && !isError && members.length === 0 && <p className={styles.empty}>{emptyLabel}</p>}

      {members.length > 0 && (
        <ul className={styles.list}>
          {members.map((member) => (
            <li key={member.id} className={styles.row}>
              <span className={styles.roleBadge}>{member.roleLabel}</span>
              <span className={styles.statusBadge}>{member.statusLabel}</span>
              <button type="button" className={styles.removeBtn} onClick={() => onRemove(member.userId)}>
                {removeLabel}
              </button>
            </li>
          ))}
        </ul>
      )}

      <InviteMemberForm />
    </section>
  )
}
