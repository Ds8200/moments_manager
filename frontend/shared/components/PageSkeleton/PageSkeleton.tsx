import type { ReactElement } from 'react'
import styles from './PageSkeleton.module.scss'

export interface PageSkeletonProps {
  rows?: number
}

export const PageSkeleton = ({ rows = 5 }: PageSkeletonProps): ReactElement => {
  return (
    <div className={styles.wrapper}>
      <div className={`${styles.bar} ${styles.header}`} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`${styles.bar} ${styles.row}`} />
      ))}
    </div>
  )
}
