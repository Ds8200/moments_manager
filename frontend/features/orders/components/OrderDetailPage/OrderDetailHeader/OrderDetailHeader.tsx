'use client'
import type { ReactElement } from 'react'
import { useOrderDetailHeader } from './useOrderDetailHeader'
import { DropdownMenu } from '@/shared/components/DropdownMenu/DropdownMenu'
import styles from './OrderDetailHeader.module.scss'
import type { OrderDetailHeaderProps } from './useOrderDetailHeader'

export const OrderDetailHeader = (props: OrderDetailHeaderProps): ReactElement => {
  const {
    orderNumber,
    customerName,
    backLabel,
    menuBtnSymbol,
    menuState,
    onBack,
    onMenuBtnClick,
    closeMenu,
  } = useOrderDetailHeader(props)

  return (
    <div className={styles.header}>
      <button type="button" className={styles.backBtn} onClick={onBack}>
        {backLabel}
      </button>
      <div className={styles.titleGroup}>
        <h1 className={styles.title}>{orderNumber}</h1>
        {customerName && <span className={styles.customer}>{customerName}</span>}
      </div>
      <button type="button" className={styles.menuBtn} onClick={onMenuBtnClick}>
        {menuBtnSymbol}
      </button>
      <DropdownMenu state={menuState} onClose={closeMenu} />
    </div>
  )
}
