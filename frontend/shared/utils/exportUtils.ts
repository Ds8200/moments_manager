export interface ExcelExportConfig {
  filename: string
  headers: string[]
  rows: (string | number)[][]
}

export interface PrintExportConfig {
  title: string
  headers: string[]
  rows: (string | number)[][]
}

// UTF-8 BOM ensures Excel displays Hebrew characters correctly
const UTF8_BOM = '﻿'

const escapeCell = (value: string | number): string => {
  const str = String(value)
  // Wrap in quotes and escape any existing quotes if the cell contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return `"${str}"`
}

export const exportToExcel = (config: ExcelExportConfig): void => {
  const allRows = [config.headers, ...config.rows]
  const csv = UTF8_BOM + allRows.map((row) => row.map(escapeCell).join(',')).join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${config.filename}.csv`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

// @page must be at top level (not inside @media print) for browsers to honour the size rule
const PRINT_STYLES = `
  @page { size: A4 landscape; margin: 10mm; }
  * { box-sizing: border-box; }
  body {
    font-family: Arial, 'Arial Hebrew', sans-serif;
    direction: rtl;
    margin: 0;
    padding: 8px;
    font-size: 11px;
    color: #212529;
  }
  h2 { margin: 0 0 8px; font-size: 14px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; }
  th {
    background: #e9ecef;
    font-weight: 700;
    padding: 4px 6px;
    border: 1px solid #ced4da;
    text-align: right;
    white-space: nowrap;
    font-size: 10px;
  }
  td {
    padding: 3px 6px;
    border: 1px solid #dee2e6;
    text-align: right;
    font-size: 10px;
    white-space: nowrap;
  }
  tr:nth-child(even) td { background: #f8f9fa; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
`

export const exportToPrint = (config: PrintExportConfig): void => {
  const headerCells = config.headers.map((h) => `<th>${h}</th>`).join('')
  const bodyRows = config.rows
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
    .join('')

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
  <head>
    <meta charset="utf-8" />
    <title>${config.title}</title>
    <style>${PRINT_STYLES}</style>
  </head>
  <body>
    <h2>${config.title}</h2>
    <table>
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
    <script>window.onload = function() { window.print(); };<\/script>
  </body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const printWindow = window.open(url, '_blank')
  if (!printWindow) {
    URL.revokeObjectURL(url)
    return
  }
  printWindow.addEventListener('load', () => URL.revokeObjectURL(url))
}
