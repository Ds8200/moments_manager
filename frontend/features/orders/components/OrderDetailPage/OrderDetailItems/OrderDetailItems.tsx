'use client'
import type { ReactElement } from 'react'
import { useOrderDetailItems } from './useOrderDetailItems'
import styles from './OrderDetailItems.module.scss'
import type { OrderDetailItemsProps } from './useOrderDetailItems'

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
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className={styles.row}>
                <td className={styles.td}>{item.product_name}</td>
                <td className={`${styles.td} ${styles.numeric}`}>{item.quantity}</td>
                <td className={`${styles.td} ${styles.numeric}`}>{formatAmount(item.unit_price)}</td>
                <td className={`${styles.td} ${styles.numeric}`}>{formatAmount(item.unit_cost)}</td>
                <td className={`${styles.td} ${styles.numeric}`}>{formatAmount(item.total_price)}</td>
                <td className={`${styles.td} ${styles.numeric} ${styles.profit}`}>{formatAmount(item.profit)}</td>
                <td className={`${styles.td} ${styles.notes}`}>{item.design_notes ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
