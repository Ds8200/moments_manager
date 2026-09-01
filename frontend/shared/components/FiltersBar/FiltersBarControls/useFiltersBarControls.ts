'use client'
import type { FiltersBarSelectConfig } from '../useFiltersBar'

export interface FiltersBarControlsProps {
  selects: FiltersBarSelectConfig[]
  showDates: boolean
  dateFrom: string
  dateTo: string
  dateFromLabel: string
  dateToLabel: string
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
}

// Pure pass-through: the collapsible controls carry no logic of their own — every value and
// handler is owned by useFiltersBar and forwarded through props.
export const useFiltersBarControls = (props: FiltersBarControlsProps): FiltersBarControlsProps =>
  props
