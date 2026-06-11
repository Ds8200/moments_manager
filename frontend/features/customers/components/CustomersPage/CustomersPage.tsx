'use client'
import type { ReactElement } from 'react'
import { useCustomersPage } from './useCustomersPage'
import { PageLayout } from '@/shared/components/PageLayout/PageLayout'
import { DataTable } from '@/shared/components/DataTable/DataTable'
import { CustomerForm } from '../CustomerForm/CustomerForm'
import { DropdownMenu } from '@/shared/components/DropdownMenu/DropdownMenu'

export const CustomersPage = (): ReactElement => {
  const {
    title, actionLabel, onAction, filtersBarProps,
    columns, rows, isLoading, isError,
    emptyTitle, emptyDescription, emptyIcon, errorTitle,
    currentPage, totalPages, total, onPageChange, paginationLabels,
    onRowLeftClick, onRowRightClick,
    menuState, closeMenu,
  } = useCustomersPage()

  return (
    <>
      <PageLayout title={title} actionLabel={actionLabel} onAction={onAction} filtersBarProps={filtersBarProps}>
        <DataTable
          columns={columns}
          rows={rows}
          keyExtractor={(c) => c.id}
          isLoading={isLoading}
          isError={isError}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
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
      <CustomerForm />
      <DropdownMenu state={menuState} onClose={closeMenu} />
    </>
  )
}
