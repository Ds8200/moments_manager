'use client'
import type { ReactElement } from 'react'
import { useLogoStep, type LogoStepProps } from './useLogoStep'
import { ONBOARDING_LABELS } from '../../../constants/onboardingLabels'
import styles from './LogoStep.module.scss'

export const LogoStep = (props: LogoStepProps): ReactElement => {
  const {
    fileInputRef,
    isUploading,
    colorEntries,
    canProceed,
    onSelectClick,
    onFileChange,
    onNextClick,
  } = useLogoStep(props)

  return (
    <div className={styles.step}>
      <div className={styles.title}>{ONBOARDING_LABELS.STEP_LOGO_TITLE}</div>
      <div className={styles.subtitle}>{ONBOARDING_LABELS.STEP_LOGO_SUBTITLE}</div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg"
        className={styles.hiddenInput}
        onChange={onFileChange}
      />

      <button
        type="button"
        className={styles.uploadButton}
        onClick={onSelectClick}
        disabled={isUploading}
      >
        {isUploading ? ONBOARDING_LABELS.UPLOADING : ONBOARDING_LABELS.UPLOAD_BUTTON}
      </button>
      <span className={styles.hint}>{ONBOARDING_LABELS.UPLOAD_HINT}</span>

      {colorEntries.length > 0 && (
        <ul className={styles.palette}>
          {colorEntries.map((entry) => (
            <li key={entry.key} className={styles.swatch}>
              <span className={styles.swatchLabel}>{entry.label}</span>
              <span className={styles.swatchHex}>{entry.hex}</span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className={styles.nextButton}
        onClick={onNextClick}
        disabled={!canProceed}
      >
        {ONBOARDING_LABELS.NEXT}
      </button>
    </div>
  )
}
