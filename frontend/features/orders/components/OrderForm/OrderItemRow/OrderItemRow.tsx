'use client'
import { useOrderItemRow } from './useOrderItemRow'
import type { OrderItemRowProps } from './useOrderItemRow'
import { Autocomplete } from '@/shared/components/Autocomplete/Autocomplete'
import styles from './OrderItemRow.module.scss'

const LABELS = {
  PRODUCT:         'מוצר',
  QTY:             'כמות',
  PRICE:           'מחיר',
  COST:            'עלות',
  SEARCH_PRODUCT:  'חפש מוצר...',
} as const

export function OrderItemRow(props: OrderItemRowProps) {
  const { index, register, errors, isOnly, onRemove } = props
  const {
    productOptions,
    isProductsLoading,
    currentProductId,
    currentProductName,
    onProductSearch,
    onProductSelect,
  } = useOrderItemRow(props)

  const itemErrors = errors.items?.[index]

  return (
    <div className={styles.row}>
      <div className={styles.productField}>
        {index === 0 && <span className={styles.label}>{LABELS.PRODUCT}</span>}
        <Autocomplete
          id={`product-${index}`}
          value={currentProductId}
          onChange={onProductSelect}
          options={productOptions}
          onSearch={onProductSearch}
          defaultLabel={currentProductName}
          isLoading={isProductsLoading}
          placeholder={LABELS.SEARCH_PRODUCT}
          error={itemErrors?.product_name?.message}
        />
      </div>
      <div className={styles.field}>
        {index === 0 && <span className={styles.label}>{LABELS.QTY}</span>}
        <input
          type="number"
          min={1}
          className={styles.input}
          {...register(`items.${index}.quantity`)}
        />
      </div>
      <div className={styles.field}>
        {index === 0 && <span className={styles.label}>{LABELS.PRICE}</span>}
        <input
          type="number"
          step="0.01"
          className={`${styles.input}${itemErrors?.unit_price ? ` ${styles.inputError}` : ''}`}
          placeholder="₪"
          {...register(`items.${index}.unit_price`)}
        />
      </div>
      <div className={styles.field}>
        {index === 0 && <span className={styles.label}>{LABELS.COST}</span>}
        <input
          type="number"
          step="0.01"
          className={styles.input}
          placeholder="₪"
          {...register(`items.${index}.unit_cost`)}
        />
      </div>
      <button
        type="button"
        className={styles.removeBtn}
        onClick={onRemove}
        disabled={isOnly}
        aria-label="הסר פריט"
      >
        ✕
      </button>
    </div>
  )
}
