'use client'
import type { ReactElement } from 'react'
import { useOrderDetailItems } from './useOrderDetailItems'
import { InlineEditField } from '@/shared/components/InlineEditField/InlineEditField'
import { Autocomplete } from '@/shared/components/Autocomplete/Autocomplete'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'
import styles from './OrderDetailItems.module.scss'
import type { OrderDetailItemsProps } from './useOrderDetailItems'

const COLUMN_COUNT = 8

export const OrderDetailItems = (props: OrderDetailItemsProps): ReactElement => {
  const {
    items,
    formatAmount,
    sectionTitle,
    colProduct,
    colQty,
    colUnitPrice,
    colUnitCost,
    colTotal,
    colProfit,
    colDesignNotes,
    addItemLabel,
    removeItemLabel,
    productSearchPlaceholder,
    isDraftOpen,
    productOptions,
    isProductsLoading,
    onProductSearch,
    onDraftProductSelect,
    onSaveQuantity,
    onSaveUnitPrice,
    onSaveUnitCost,
    onSaveDesignNotes,
    onRemoveItem,
    onStartAddItem,
  } = useOrderDetailItems(props)

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{sectionTitle}</h2>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>{colProduct}</th>
              <th className={`${styles.th} ${styles.numeric}`}>{colQty}</th>
              <th className={`${styles.th} ${styles.numeric}`}>{colUnitPrice}</th>
              <th className={`${styles.th} ${styles.numeric}`}>{colUnitCost}</th>
              <th className={`${styles.th} ${styles.numeric}`}>{colTotal}</th>
              <th className={`${styles.th} ${styles.numeric} ${styles.profitCol}`}>{colProfit}</th>
              <th className={styles.th}>{colDesignNotes}</th>
              <th className={styles.th} />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className={styles.row}>
                <td className={styles.td}>{item.product_name}</td>
                <td className={`${styles.td} ${styles.numeric}`}>
                  <InlineEditField
                    label=""
                    value={String(item.quantity)}
                    type="number"
                    editable
                    onSave={(v) => onSaveQuantity(item.id, v)}
                  />
                </td>
                <td className={`${styles.td} ${styles.numeric}`}>
                  <InlineEditField
                    label=""
                    value={item.unit_price}
                    type="number"
                    editable
                    onSave={(v) => onSaveUnitPrice(item.id, v)}
                  />
                </td>
                <td className={`${styles.td} ${styles.numeric}`}>
                  <InlineEditField
                    label=""
                    value={item.unit_cost}
                    type="number"
                    editable
                    onSave={(v) => onSaveUnitCost(item.id, v)}
                  />
                </td>
                <td className={`${styles.td} ${styles.numeric}`}>{formatAmount(item.total_price)}</td>
                <td className={`${styles.td} ${styles.numeric} ${styles.profit}`}>{formatAmount(item.profit)}</td>
                <td className={`${styles.td} ${styles.notes}`}>
                  <InlineEditField
                    label=""
                    value={item.design_notes ?? ''}
                    type="text"
                    editable
                    onSave={(v) => onSaveDesignNotes(item.id, v)}
                  />
                </td>
                <td className={styles.td}>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => onRemoveItem(item.id)}
                    disabled={items.length === 1}
                    aria-label={removeItemLabel}
                  >
                    {UI_SYMBOLS.CLOSE}
                  </button>
                </td>
              </tr>
            ))}
            {isDraftOpen && (
              <tr className={styles.row}>
                <td className={styles.td} colSpan={COLUMN_COUNT}>
                  <Autocomplete
                    id="new-order-item-product"
                    value={null}
                    onChange={onDraftProductSelect}
                    options={productOptions}
                    onSearch={onProductSearch}
                    isLoading={isProductsLoading}
                    placeholder={productSearchPlaceholder}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button type="button" className={styles.addItemBtn} onClick={onStartAddItem}>
        {addItemLabel}
      </button>
    </section>
  )
}
