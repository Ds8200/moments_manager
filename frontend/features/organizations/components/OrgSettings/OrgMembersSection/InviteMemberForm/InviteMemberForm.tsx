'use client'
import type { ReactElement } from 'react'
import { useInviteMemberForm } from './useInviteMemberForm'
import { ORG_ROLE } from '../../../../enums/orgRoleEnums'
import styles from './InviteMemberForm.module.scss'

export const InviteMemberForm = (): ReactElement => {
  const {
    register,
    handleSubmit,
    onSubmit,
    errors,
    isSubmitting,
    sectionTitle,
    emailLabel,
    emailPlaceholder,
    roleLabel,
    adminRoleLabel,
    memberRoleLabel,
    submitLabel,
    submittingLabel,
  } = useInviteMemberForm()

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>{sectionTitle}</h3>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="invite_email">
            {emailLabel}
          </label>
          <input
            id="invite_email"
            type="email"
            placeholder={emailPlaceholder}
            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            {...register('email')}
          />
          {errors.email && <span className={styles.errorMsg}>{errors.email.message}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="invite_role">
            {roleLabel}
          </label>
          <select id="invite_role" className={styles.input} {...register('role')}>
            <option value={ORG_ROLE.MEMBER}>{memberRoleLabel}</option>
            <option value={ORG_ROLE.ADMIN}>{adminRoleLabel}</option>
          </select>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
      </form>
    </div>
  )
}
