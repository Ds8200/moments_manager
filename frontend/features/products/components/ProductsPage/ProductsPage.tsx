'use client'
import type { ReactElement } from 'react'
import { useProductsPage } from './useProductsPage'
import { PageLayout } from '@/shared/components/PageLayout/PageLayout'
import { DataTable } from '@/shared/components/DataTable/DataTable'
import { ProductForm } from '../ProductForm/ProductForm'
import { DropdownMenu } from '@/shared/components/DropdownMenu/DropdownMenu'

export const ProductsPage = (): ReactElement => {
  const {
    title, actionLabel, onAction, filtersBarProps,
    columns, rows, isLoading, isError,
    emptyTitle, emptyDescription, emptyIcon, errorTitle,
    currentPage, totalPages, total, onPageChange, paginationLabels,
    onRowLeftClick, onRowRightClick,
    menuState, closeMenu,
  } = useProductsPage()

  return (
    <>
      <PageLayout title={title} actionLabel={actionLabel} onAction={onAction} filtersBarProps={filtersBarProps}>
        <DataTable
          columns={columns}
          rows={rows}
          keyExtractor={(p) => p.id}
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
      <ProductForm />
      <DropdownMenu state={menuState} onClose={closeMenu} />
    </>
  )
}
