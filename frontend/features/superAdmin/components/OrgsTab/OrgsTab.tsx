'use client'
import type { ReactElement } from 'react'
import { useOrgsTab } from './useOrgsTab'
import { PageLayout } from '@/shared/components/PageLayout/PageLayout'
import { DataTable } from '@/shared/components/DataTable/DataTable'
import { DropdownMenu } from '@/shared/components/DropdownMenu/DropdownMenu'
import { OrgFormModal } from '../OrgFormModal/OrgFormModal'

export const OrgsTab = (): ReactElement => {
  const {
    title, actionLabel, onAction, filtersBarProps,
    columns, rows, isLoading, isError,
    emptyTitle, emptyIcon, errorTitle,
    currentPage, totalPages, total, onPageChange, paginationLabels,
    onRowLeftClick, onRowRightClick,
    menuState, closeMenu,
  } = useOrgsTab()

  return (
    <>
      <PageLayout title={title} actionLabel={actionLabel} onAction={onAction} filtersBarProps={filtersBarProps}>
        <DataTable
          columns={columns}
          rows={rows}
          keyExtractor={(o) => o.id}
          isLoading={isLoading}
          isError={isError}
          emptyTitle={emptyTitle}
          emptyDescription=""
          emptyIcon={emptyIcon}
          errorTitle={errorTitle}
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          onPageChange={onPageChange}
          paginationLabels={paginationLabels}
          onRowLeftClick={onRowLeftClick}
          onRowRightClick={onRowRightClick}
        />
      </PageLayout>
      <DropdownMenu state={menuState} onClose={closeMenu} />
      <OrgFormModal />
    </>
  )
}
