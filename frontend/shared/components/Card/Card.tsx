import type { ReactElement } from 'react'
import styles from './Card.module.scss'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

export const Card = ({ children, className = '', padding = 'md' }: CardProps): ReactElement => {
  return (
    <div className={`${styles.card} ${styles[`padding-${padding}`]} ${className}`}>
      {children}
    </div>
  )
}
