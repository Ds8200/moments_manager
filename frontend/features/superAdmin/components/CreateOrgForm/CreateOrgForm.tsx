'use client'
import { useCreateOrgForm } from './useCreateOrgForm'
import styles from './CreateOrgForm.module.scss'

export const CreateOrgForm = (): JSX.Element => {
  const {
    register,
    handleSubmit,
    onSubmit,
    errors,
    isPending,
    planOptions,
    onBack,
    title,
    backLabel,
    fieldBusinessName,
    fieldSlug,
    fieldSlugHint,
    fieldOwnerFullName,
    fieldOwnerEmail,
    fieldOwnerPassword,
    fieldPlan,
    submitLabel,
  } = useCreateOrgForm()

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <button type="button" onClick={onBack} className={styles.backBtn}>
          {backLabel}
        </button>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
        <div className={styles.field}>
          <label className={styles.label}>{fieldBusinessName}</label>
          <input {...register('business_name')} className={styles.input} />
          {errors.business_name && <span className={styles.error}>{errors.business_name.message}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{fieldSlug}</label>
          <input {...register('slug')} className={styles.input} dir="ltr" />
          <span className={styles.hint}>{fieldSlugHint}</span>
          {errors.slug && <span className={styles.error}>{errors.slug.message}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{fieldOwnerFullName}</label>
          <input {...register('owner_full_name')} className={styles.input} />
          {errors.owner_full_name && <span className={styles.error}>{errors.owner_full_name.message}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{fieldOwnerEmail}</label>
          <input {...register('owner_email')} type="email" className={styles.input} dir="ltr" />
          {errors.owner_email && <span className={styles.error}>{errors.owner_email.message}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{fieldOwnerPassword}</label>
          <input {...register('owner_password')} type="password" className={styles.input} dir="ltr" />
          {errors.owner_password && <span className={styles.error}>{errors.owner_password.message}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{fieldPlan}</label>
          <select {...register('plan')} className={styles.select}>
            {planOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.plan && <span className={styles.error}>{errors.plan.message}</span>}
        </div>

        <button type="submit" disabled={isPending} className={styles.submitBtn}>
          {submitLabel}
        </button>
      </form>
    </div>
  )
}
