import type { ReactElement, FormEventHandler } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import styles from './OrgEditForm.module.scss'

export interface OrgEditFormProps {
  onSubmit: FormEventHandler<HTMLFormElement>
  onCancel: () => void
  isPending: boolean
  nameInputProps: UseFormRegisterReturn
  slugInputProps: UseFormRegisterReturn
  nameError: string | undefined
  slugError: string | undefined
  fieldNameLabel: string
  fieldSlugLabel: string
  slugHint: string
  saveLabel: string
  cancelLabel: string
}

export const OrgEditForm = ({
  onSubmit,
  onCancel,
  isPending,
  nameInputProps,
  slugInputProps,
  nameError,
  slugError,
  fieldNameLabel,
  fieldSlugLabel,
  slugHint,
  saveLabel,
  cancelLabel,
}: OrgEditFormProps): ReactElement => (
  <form onSubmit={onSubmit} className={styles.form} noValidate>
    <div className={styles.field}>
      <label className={styles.label}>{fieldNameLabel}</label>
      <input className={`${styles.input}${nameError ? ` ${styles.inputError}` : ''}`} {...nameInputProps} />
      {nameError && <span className={styles.error}>{nameError}</span>}
    </div>
    <div className={styles.field}>
      <label className={styles.label}>{fieldSlugLabel}</label>
      <input
        className={`${styles.input}${slugError ? ` ${styles.inputError}` : ''}`}
        dir="ltr"
        {...slugInputProps}
      />
      {slugError ? (
        <span className={styles.error}>{slugError}</span>
      ) : (
        <span className={styles.hint}>{slugHint}</span>
      )}
    </div>
    <div className={styles.actions}>
      <button type="submit" className={styles.saveBtn} disabled={isPending}>
        {saveLabel}
      </button>
      <button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={isPending}>
        {cancelLabel}
      </button>
    </div>
  </form>
)
