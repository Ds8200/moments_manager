'use client'
import type { ReactElement } from 'react'
import { useOrderItemRow } from './useOrderItemRow'
import type { OrderItemRowProps } from './useOrderItemRow'
import { Autocomplete } from '@/shared/components/Autocomplete/Autocomplete'
import { ORDERS_LABELS } from '@/features/orders/constants/ordersLabels'
import styles from './OrderItemRow.module.scss'

export const OrderItemRow = (props: OrderItemRowProps): ReactElement => {
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
        {index === 0 && <span className={styles.label}>{ORDERS_LABELS.ITEM_PRODUCT}</span>}
        <Autocomplete
          id={`product-${index}`}
          value={currentProductId}
          onChange={onProductSelect}
          options={productOptions}
          onSearch={onProductSearch}
          defaultLabel={currentProductName}
          isLoading={isProductsLoading}
          placeholder={ORDERS_LABELS.ITEM_SEARCH_PRODUCT}
          error={itemErrors?.product_name?.message}
        />
      </div>
      <div className={styles.field}>
        {index === 0 && <span className={styles.label}>{ORDERS_LABELS.ITEM_QTY}</span>}
        <input
          type="number"
          min={1}
          className={styles.input}
          {...register(`items.${index}.quantity`)}
        />
      </div>
      <div className={styles.field}>
        {index === 0 && <span className={styles.label}>{ORDERS_LABELS.ITEM_PRICE}</span>}
        <input
          type="number"
          step="0.01"
          className={`${styles.input}${itemErrors?.unit_price ? ` ${styles.inputError}` : ''}`}
          placeholder="₪"
          {...register(`items.${index}.unit_price`)}
        />
      </div>
      <div className={styles.field}>
        {index === 0 && <span className={styles.label}>{ORDERS_LABELS.ITEM_COST}</span>}
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
        aria-label={ORDERS_LABELS.ITEM_REMOVE}
      >
        ✕
      </button>
    </div>
  )
}
