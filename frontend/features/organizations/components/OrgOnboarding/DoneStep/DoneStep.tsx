import type { ReactElement } from 'react'
import Link from 'next/link'
import { ONBOARDING_LABELS } from '../../../constants/onboardingLabels'
import { ROUTES } from '@/shared/constants/routes'
import styles from './DoneStep.module.scss'

export const DoneStep = (): ReactElement => {
  return (
    <div className={styles.step}>
      <div className={styles.title}>{ONBOARDING_LABELS.STEP_DONE_TITLE}</div>
      <div className={styles.subtitle}>{ONBOARDING_LABELS.STEP_DONE_SUBTITLE}</div>
      <Link href={ROUTES.HOME} className={styles.dashboardLink}>
        {ONBOARDING_LABELS.GO_TO_DASHBOARD}
      </Link>
    </div>
  )
}
