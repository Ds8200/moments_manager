'use client'
import type { ReactElement } from 'react'
import { useUsersTab } from './useUsersTab'
import { PageLayout } from '@/shared/components/PageLayout/PageLayout'
import { DataTable } from '@/shared/components/DataTable/DataTable'
import { DropdownMenu } from '@/shared/components/DropdownMenu/DropdownMenu'

export const UsersTab = (): ReactElement => {
  const {
    title, filtersBarProps,
    columns, rows, isLoading, isError,
    emptyTitle, emptyIcon, errorTitle,
    currentPage, totalPages, total, onPageChange, paginationLabels,
    onRowLeftClick, onRowRightClick,
    menuState, closeMenu,
  } = useUsersTab()

  return (
    <>
      <PageLayout title={title} filtersBarProps={filtersBarProps}>
        <DataTable
          columns={columns}
          rows={rows}
          keyExtractor={(u) => u.id}
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
    </>
  )
}
