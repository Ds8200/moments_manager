'use client'
import { useRouter } from 'next/navigation'
import type { MouseEvent } from 'react'
import { useDropdownMenu } from '@/shared/components/DropdownMenu/useDropdownMenu'
import type { DropdownMenuItem, DropdownMenuState } from '@/shared/components/DropdownMenu/useDropdownMenu'
import { UI_SYMBOLS } from '@/shared/constants/uiSymbols'

export interface RecordDetailHeaderProps {
  title: string
  subtitle?: string
  backLabel: string
  backHref: string
  menuTitle: string
  menuItems: DropdownMenuItem[]
}

export interface UseRecordDetailHeaderReturn {
  title: string
  subtitle: string | undefined
  backLabel: string
  menuBtnSymbol: string
  showMenuBtn: boolean
  menuState: DropdownMenuState
  onBack: () => void
  onMenuBtnClick: (e: MouseEvent<Element>) => void
  closeMenu: () => void
}

export const useRecordDetailHeader = (props: RecordDetailHeaderProps): UseRecordDetailHeaderReturn => {
  const router = useRouter()
  const { menuState, openMenu, closeMenu } = useDropdownMenu()

  return {
    title: props.title,
    subtitle: props.subtitle,
    backLabel: props.backLabel,
    menuBtnSymbol: UI_SYMBOLS.SETTINGS,
    showMenuBtn: props.menuItems.length > 0,

    menuState,
    closeMenu,

    onBack: () => router.push(props.backHref),
    onMenuBtnClick: (e) => openMenu(props.menuTitle, props.menuItems, e),
  }
}
