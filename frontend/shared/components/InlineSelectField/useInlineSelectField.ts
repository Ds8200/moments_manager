'use client'

export interface InlineSelectFieldProps {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}

export interface UseInlineSelectFieldReturn {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}

export const useInlineSelectField = (props: InlineSelectFieldProps): UseInlineSelectFieldReturn => {
  return props
}
