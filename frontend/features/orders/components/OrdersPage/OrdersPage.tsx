'use client'
import type { ReactElement } from 'react'
import { useOrdersPage } from './useOrdersPage'
import { PageLayout } from '@/shared/components/PageLayout/PageLayout'
import { DataTable } from '@/shared/components/DataTable/DataTable'
import { OrderForm } from '../OrderForm/OrderForm'
import { DropdownMenu } from '@/shared/components/DropdownMenu/DropdownMenu'

export const OrdersPage = (): ReactElement => {
  const {
    title, actionLabel, onAction, filtersBarProps,
    columns, rows, isLoading, isError,
    emptyTitle, emptyDescription, emptyIcon, errorTitle,
    currentPage, totalPages, total, onPageChange, paginationLabels,
    onRowLeftClick, onRowRightClick,
    menuState, closeMenu,
  } = useOrdersPage()

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
      <OrderForm />
      <DropdownMenu state={menuState} onClose={closeMenu} />
    </>
  )
}
