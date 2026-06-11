'use client'
import type { ReactElement } from 'react'
import { useOrgLogoCard } from './useOrgLogoCard'
import styles from './OrgLogoCard.module.scss'

export const OrgLogoCard = (): ReactElement => {
  const {
    fileInputRef,
    sectionTitle,
    subtitle,
    currentLogoLabel,
    logoPath,
    noLogoLabel,
    changeLogoBtnLabel,
    uploadingLabel,
    uploadHint,
    isUploading,
    colorEntries,
    onSelectClick,
    onFileChange,
  } = useOrgLogoCard()

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{sectionTitle}</h2>
      <p className={styles.subtitle}>{subtitle}</p>

      <div className={styles.currentLogo}>
        <span className={styles.currentLogoLabel}>{currentLogoLabel}</span>
        <span className={styles.currentLogoValue}>{logoPath ?? noLogoLabel}</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg"
        className={styles.hiddenInput}
        onChange={onFileChange}
      />

      <button type="button" className={styles.changeButton} onClick={onSelectClick} disabled={isUploading}>
        {isUploading ? uploadingLabel : changeLogoBtnLabel}
      </button>
      <span className={styles.hint}>{uploadHint}</span>

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
    </section>
  )
}
