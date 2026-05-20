'use client'
import type { ReactElement } from 'react'
import { Controller } from 'react-hook-form'
import { useOrderForm } from './useOrderForm'
import { OrderItemRow } from './OrderItemRow/OrderItemRow'
import { Autocomplete } from '@/shared/components/Autocomplete/Autocomplete'
import { ORDERS_LABELS } from '../../constants/ordersLabels'
import styles from './OrderForm.module.scss'

export const OrderForm = (): ReactElement | null => {
  const {
    isOpen, isEditing, register, control, setValue, handleSubmit, onSubmit,
    errors, isSubmitting, fields, appendItem, removeItem, onClose,
    customerOptions, customersLoading, setCustomerSearch, customerDefaultLabel,
  } = useOrderForm()

  return isOpen ? (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isEditing ? ORDERS_LABELS.FORM_EDIT_TITLE : ORDERS_LABELS.FORM_NEW_TITLE}</h2>
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
                  label={ORDERS_LABELS.FORM_CUSTOMER}
                  value={field.value || null}
                  onChange={(value) => field.onChange(value ?? '')}
                  options={customerOptions}
                  onSearch={setCustomerSearch}
                  defaultLabel={customerDefaultLabel}
                  isLoading={customersLoading}
                  placeholder={ORDERS_LABELS.FORM_CUSTOMER_PLACEHOLDER}
                  error={errors.customer_id?.message}
                />
              )}
            />

            <div className={styles.field}>
              <label className={styles.label}>{ORDERS_LABELS.FORM_DATE}</label>
              <input
                type="date"
                className={`${styles.input}${errors.date ? ` ${styles.error}` : ''}`}
                {...register('date')}
              />
              {errors.date && <span className={styles.errorText}>{errors.date.message}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{ORDERS_LABELS.FORM_DUE_DATETIME}</label>
              <input
                type="datetime-local"
                className={styles.input}
                {...register('due_datetime')}
              />
            </div>

            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>{ORDERS_LABELS.FORM_NOTES}</label>
              <textarea className={styles.textarea} {...register('notes')} />
            </div>
          </div>

          <div className={styles.sectionTitle}>{ORDERS_LABELS.FORM_ITEMS_SECTION}</div>

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
            {ORDERS_LABELS.FORM_ADD_ITEM}
          </button>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              {ORDERS_LABELS.FORM_CANCEL}
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? ORDERS_LABELS.FORM_SAVING : ORDERS_LABELS.FORM_SAVE}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null
}
