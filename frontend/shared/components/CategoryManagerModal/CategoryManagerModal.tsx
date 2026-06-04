'use client'
import type { ReactElement } from 'react'
import { useCategoryManagerModal } from './useCategoryManagerModal'
import type { UseCategoryManagerModalOptions } from './useCategoryManagerModal'
import styles from './CategoryManagerModal.module.scss'

export const CategoryManagerModal = (props: UseCategoryManagerModalOptions): ReactElement => {
  const {
    categories, isLoading, addRegister, addHandleSubmit, onAdd,
    isAdding, onDelete, deleteErrors, onClose, closeSymbol, labels,
  } = useCategoryManagerModal(props)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{labels.title}</h3>
          <button className={styles.closeBtn} onClick={onClose}>{closeSymbol}</button>
        </div>

        <div className={styles.list}>
          {!isLoading && categories.length === 0 && (
            <p className={styles.empty}>{labels.empty}</p>
          )}
          {categories.map((cat) => (
            <div key={cat.id} className={styles.row}>
              <span className={styles.rowName}>{cat.name}</span>
              <div className={styles.rowActions}>
                {deleteErrors[cat.id] && (
                  <span className={styles.rowError}>{deleteErrors[cat.id]}</span>
                )}
                <button
                  className={styles.deleteBtn}
                  onClick={() => onDelete(cat.id)}
                  title={labels.deleteTitle}
                >
                  {closeSymbol}
                </button>
              </div>
            </div>
          ))}
        </div>

        <form className={styles.addForm} onSubmit={addHandleSubmit(onAdd)} noValidate>
          <input
            className={styles.addInput}
            placeholder={labels.addPlaceholder}
            {...addRegister('name')}
          />
          <button type="submit" className={styles.addBtn} disabled={isAdding}>
            {labels.addBtn}
          </button>
        </form>
      </div>
    </div>
  )
}
