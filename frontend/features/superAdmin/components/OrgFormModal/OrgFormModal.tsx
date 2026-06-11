'use client'
import type { ReactElement } from 'react'
import { Controller } from 'react-hook-form'
import { useOrgFormModal } from './useOrgFormModal'
import { UserFormModal } from './UserFormModal/UserFormModal'
import { Autocomplete } from '@/shared/components/Autocomplete/Autocomplete'
import { SUPER_ADMIN_LABELS } from '../../constants/superAdminLabels'
import styles from './OrgFormModal.module.scss'

export const OrgFormModal = (): ReactElement | null => {
  const {
    isOpen, isEditMode, onClose, closeSymbol, planOptions,
    createRegister, createErrors, createControl, isCreateSubmitting, onCreateSubmit,
    selectedUserId, ownerOptions, ownerSearch, setOwnerSearch, ownerLoading,
    onOwnerChange,
    editRegister, editErrors, isEditSubmitting, onEditSubmit,
  } = useOrgFormModal()

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEditMode ? SUPER_ADMIN_LABELS.MODAL_EDIT_ORG_TITLE : SUPER_ADMIN_LABELS.MODAL_CREATE_ORG_TITLE}
          </h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}>{closeSymbol}</button>
        </div>

        {isEditMode ? (
          <form onSubmit={onEditSubmit} noValidate>
            <div className={styles.fields}>
              <div className={styles.field}>
                <label className={styles.label}>{SUPER_ADMIN_LABELS.FIELD_BUSINESS_NAME}</label>
                <input
                  className={`${styles.input}${editErrors.name ? ` ${styles.inputError}` : ''}`}
                  {...editRegister('name')}
                />
                {editErrors.name && <span className={styles.errorText}>{editErrors.name.message}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>{SUPER_ADMIN_LABELS.FIELD_SLUG}</label>
                <input className={styles.input} {...editRegister('slug')} />
                <span className={styles.hint}>{SUPER_ADMIN_LABELS.FIELD_SLUG_HINT}</span>
              </div>
            </div>

            <div className={styles.footer}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
                {SUPER_ADMIN_LABELS.CANCEL}
              </button>
              <button type="submit" className={styles.submitBtn} disabled={isEditSubmitting}>
                {isEditSubmitting ? SUPER_ADMIN_LABELS.SUBMITTING : SUPER_ADMIN_LABELS.SUBMIT_SAVE}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={onCreateSubmit} noValidate>
            <div className={styles.fields}>
              <Controller
                control={createControl}
                name="existing_user_id"
                render={() => (
                  <Autocomplete
                    id="owner-picker"
                    label={SUPER_ADMIN_LABELS.FIELD_OWNER_PICKER}
                    value={selectedUserId ?? null}
                    onChange={onOwnerChange}
                    options={ownerOptions}
                    onSearch={setOwnerSearch}
                    isLoading={ownerLoading}
                    placeholder={SUPER_ADMIN_LABELS.OWNER_PICKER_PLACEHOLDER}
                    error={createErrors.existing_user_id?.message}
                  />
                )}
              />

              <div className={styles.field}>
                <label className={styles.label}>{SUPER_ADMIN_LABELS.FIELD_BUSINESS_NAME}</label>
                <input
                  className={`${styles.input}${createErrors.business_name ? ` ${styles.inputError}` : ''}`}
                  {...createRegister('business_name')}
                />
                {createErrors.business_name && (
                  <span className={styles.errorText}>{createErrors.business_name.message}</span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>{SUPER_ADMIN_LABELS.FIELD_PLAN}</label>
                <select className={styles.select} {...createRegister('plan')}>
                  {planOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>{SUPER_ADMIN_LABELS.FIELD_SLUG}</label>
                <input className={styles.input} {...createRegister('slug')} />
                <span className={styles.hint}>{SUPER_ADMIN_LABELS.FIELD_SLUG_HINT}</span>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>{SUPER_ADMIN_LABELS.TABLE_COL_ORG_NUMBER}</label>
                <input
                  className={`${styles.input} ${styles.readOnly}`}
                  value={SUPER_ADMIN_LABELS.ORG_NUMBER_AUTO_ASSIGNED}
                  readOnly
                />
              </div>
            </div>

            <div className={styles.footer}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
                {SUPER_ADMIN_LABELS.CANCEL}
              </button>
              <button type="submit" className={styles.submitBtn} disabled={isCreateSubmitting}>
                {isCreateSubmitting ? SUPER_ADMIN_LABELS.SUBMITTING : SUPER_ADMIN_LABELS.SUBMIT_SAVE}
              </button>
            </div>
          </form>
        )}

        <UserFormModal />
      </div>
    </div>
  )
}
