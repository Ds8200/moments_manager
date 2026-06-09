'use client'
import type { ReactElement } from 'react'
import { useExpensesPage } from './useExpensesPage'
import { PageLayout } from '@/shared/components/PageLayout/PageLayout'
import { DataTable } from '@/shared/components/DataTable/DataTable'
import { ExpenseForm } from '../ExpenseForm/ExpenseForm'
import { DropdownMenu } from '@/shared/components/DropdownMenu/DropdownMenu'

export const ExpensesPage = (): ReactElement => {
  const {
    title, actionLabel, onAction, filtersBarProps,
    columns, rows, isLoading, isError,
    emptyTitle, emptyDescription, emptyIcon, errorTitle,
    currentPage, totalPages, total, onPageChange, paginationLabels,
    onRowLeftClick, onRowRightClick,
    menuState, closeMenu,
  } = useExpensesPage()

  return (
    <>
      <PageLayout title={title} actionLabel={actionLabel} onAction={onAction} filtersBarProps={filtersBarProps}>
        <DataTable
          columns={columns}
          rows={rows}
          keyExtractor={(e) => e.id}
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
      <ExpenseForm />
      <DropdownMenu state={menuState} onClose={closeMenu} />
    </>
  )
}
