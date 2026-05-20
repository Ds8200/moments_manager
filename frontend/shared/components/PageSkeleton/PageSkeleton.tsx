import styles from './PageSkeleton.module.scss'

export interface PageSkeletonProps {
  rows?: number
}

export function PageSkeleton({ rows = 5 }: PageSkeletonProps) {
  return (
    <div className={styles.wrapper}>
      <div className={`${styles.bar} ${styles.header}`} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`${styles.bar} ${styles.row}`} />
      ))}
    </div>
  )
}
