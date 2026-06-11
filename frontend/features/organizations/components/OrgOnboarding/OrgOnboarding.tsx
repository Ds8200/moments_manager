'use client'
import type { ReactElement } from 'react'
import { useOrgOnboarding } from './useOrgOnboarding'
import { LogoStep } from './LogoStep/LogoStep'
import { InviteStep } from './InviteStep/InviteStep'
import { IntegrationsStep } from './IntegrationsStep/IntegrationsStep'
import { DoneStep } from './DoneStep/DoneStep'
import { ONBOARDING_STEP } from '../../enums/onboardingEnums'
import styles from './OrgOnboarding.module.scss'

export const OrgOnboarding = (): ReactElement => {
  const { currentStep, stepLabels, goToNextStep, goToPreviousStep } = useOrgOnboarding()

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <ol className={styles.stepper}>
          {stepLabels.map((label, index) => (
            <li
              key={label}
              className={`${styles.step}${index === currentStep ? ` ${styles.stepActive}` : ''}`}
            >
              <span className={styles.stepNumber}>{index + 1}</span>
              <span className={styles.stepLabel}>{label}</span>
            </li>
          ))}
        </ol>

        {currentStep === ONBOARDING_STEP.LOGO && <LogoStep onNext={goToNextStep} />}
        {currentStep === ONBOARDING_STEP.INVITE && (
          <InviteStep onNext={goToNextStep} onBack={goToPreviousStep} />
        )}
        {currentStep === ONBOARDING_STEP.INTEGRATIONS && (
          <IntegrationsStep onNext={goToNextStep} onBack={goToPreviousStep} />
        )}
        {currentStep === ONBOARDING_STEP.DONE && <DoneStep />}
      </div>
    </div>
  )
}
