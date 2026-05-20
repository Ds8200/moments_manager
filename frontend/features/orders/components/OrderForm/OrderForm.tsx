'use client'
import { Controller } from 'react-hook-form'
import { useOrderForm } from './useOrderForm'
import { OrderItemRow } from './OrderItemRow/OrderItemRow'
import { Autocomplete } from '@/shared/components/Autocomplete/Autocomplete'
import styles from './OrderForm.module.scss'

const LABELS = {
  NEW_TITLE:            'הזמנה חדשה',
  EDIT_TITLE:           'עריכת הזמנה',
  CUSTOMER:             'לקוח',
  CUSTOMER_PLACEHOLDER: 'חפש לקוח...',
  DATE:                 'תאריך',
  TARGET:               'יעד / מועד',
  NOTES:                'הערות',
  ITEMS:                'פריטים',
  ADD_ITEM:             '+ הוסף פריט',
  CANCEL:               'ביטול',
  SAVE:                 'שמור',
  SAVING:               'שומר...',
} as const

export function OrderForm() {
  const {
    isOpen, isEditing, register, control, setValue, handleSubmit, onSubmit,
    errors, isSubmitting, fields, appendItem, removeItem, onClose,
    customerOptions, customersLoading, setCustomerSearch, customerDefaultLabel,
  } = useOrderForm()

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isEditing ? LABELS.EDIT_TITLE : LABELS.NEW_TITLE}</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.grid2}>
            <Controller
              control={control}
              name="customer_id"
              render={({ field }) => (
                <Autocomplete
                  id="customer"
                  label={LABELS.CUSTOMER}
                  value={field.value || null}
                  onChange={(value) => field.onChange(value ?? '')}
                  options={customerOptions}
                  onSearch={setCustomerSearch}
                  defaultLabel={customerDefaultLabel}
                  isLoading={customersLoading}
                  placeholder={LABELS.CUSTOMER_PLACEHOLDER}
                  error={errors.customer_id?.message}
                />
              )}
            />

            <div className={styles.field}>
              <label className={styles.label}>{LABELS.DATE}</label>
              <input
                type="date"
                className={`${styles.input}${errors.date ? ` ${styles.error}` : ''}`}
                {...register('date')}
              />
              {errors.date && <span className={styles.errorText}>{errors.date.message}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{LABELS.TARGET}</label>
              <input
                className={styles.input}
                placeholder="שישי, ראשון בלילה..."
                {...register('target_description')}
              />
            </div>

            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>{LABELS.NOTES}</label>
              <textarea className={styles.textarea} {...register('notes')} />
            </div>
          </div>

          <div className={styles.sectionTitle}>{LABELS.ITEMS}</div>

          {fields.map((field, idx) => (
            <OrderItemRow
              key={field.id}
              index={idx}
              control={control}
              register={register}
              setValue={setValue}
              errors={errors}
              isOnly={fields.length === 1}
              onRemove={() => removeItem(idx)}
            />
          ))}

          <button type="button" className={styles.addItemBtn} onClick={appendItem}>
            {LABELS.ADD_ITEM}
          </button>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              {LABELS.CANCEL}
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? LABELS.SAVING : LABELS.SAVE}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
