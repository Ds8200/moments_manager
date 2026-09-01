'use client'
import type { ReactElement } from 'react'
import { useRecordDetailHeader } from './useRecordDetailHeader'
import type { RecordDetailHeaderProps } from './useRecordDetailHeader'
import { DropdownMenu } from '@/shared/components/DropdownMenu/DropdownMenu'
import styles from './RecordDetailHeader.module.scss'

export const RecordDetailHeader = (props: RecordDetailHeaderProps): ReactElement => {
  const {
    title, subtitle, backLabel, menuBtnSymbol, showMenuBtn,
    menuState, onBack, onMenuBtnClick, closeMenu,
  } = useRecordDetailHeader(props)

  return (
    <div className={styles.header}>
      <button type="button" className={styles.backBtn} onClick={onBack}>
        {backLabel}
      </button>
      <div className={styles.titleGroup}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
      {showMenuBtn && (
        <button type="button" className={styles.menuBtn} onClick={onMenuBtnClick}>
          {menuBtnSymbol}
        </button>
      )}
      <DropdownMenu state={menuState} onClose={closeMenu} />
    </div>
  )
}
