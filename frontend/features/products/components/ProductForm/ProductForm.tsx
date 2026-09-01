'use client'
import type { ReactElement } from 'react'
import { useProductForm } from './useProductForm'
import { CategoryManagerModal } from '@/shared/components/CategoryManagerModal/CategoryManagerModal'
import { PRODUCTS_LABELS } from '../../constants/productsLabels'
import styles from './ProductForm.module.scss'

export const ProductForm = (): ReactElement | null => {
  const {
    isOpen, register, handleSubmit, onSubmit, errors, isSubmitting, onClose,
    categories, isCategoryManagerOpen, openCategoryManager,
    categoryManagerOptions, closeSymbol, currencySymbol,
  } = useProductForm()

  return isOpen ? (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{PRODUCTS_LABELS.FORM_NEW_TITLE}</h2>
          <button className={styles.closeBtn} onClick={onClose}>{closeSymbol}</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>{PRODUCTS_LABELS.FORM_NAME}</label>
              <input className={`${styles.input}${errors.name ? ` ${styles.error}` : ''}`} {...register('name')} />
              {errors.name && <span className={styles.errorText}>{errors.name.message}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{PRODUCTS_LABELS.FORM_CATEGORY}</label>
              <div className={styles.categoryRow}>
                <select className={styles.input} {...register('category_id')}>
                  <option value="">{PRODUCTS_LABELS.FORM_CATEGORY_PLACEHOLDER}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <button type="button" className={styles.manageBtn} onClick={openCategoryManager}>
                  {PRODUCTS_LABELS.FORM_MANAGE_CATEGORIES}
                </button>
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{PRODUCTS_LABELS.FORM_PRICE}</label>
              <input className={`${styles.input}${errors.base_price ? ` ${styles.error}` : ''}`} placeholder={currencySymbol} {...register('base_price')} />
              {errors.base_price && <span className={styles.errorText}>{errors.base_price.message}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{PRODUCTS_LABELS.FORM_COST}</label>
              <input className={`${styles.input}${errors.base_cost ? ` ${styles.error}` : ''}`} placeholder={currencySymbol} {...register('base_cost')} />
              {errors.base_cost && <span className={styles.errorText}>{errors.base_cost.message}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{PRODUCTS_LABELS.FORM_PROD_DAYS}</label>
              <input type="number" className={styles.input} {...register('avg_production_days', { valueAsNumber: true })} />
            </div>
            <div className={`${styles.field} ${styles.checkboxField}`}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" {...register('is_active')} />
                {PRODUCTS_LABELS.FORM_IS_ACTIVE}
              </label>
            </div>
          </div>
          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>{PRODUCTS_LABELS.FORM_CANCEL}</button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? PRODUCTS_LABELS.FORM_SAVING : PRODUCTS_LABELS.FORM_SAVE}
            </button>
          </div>
        </form>
        {isCategoryManagerOpen && <CategoryManagerModal {...categoryManagerOptions} />}
      </div>
    </div>
  ) : null
}
