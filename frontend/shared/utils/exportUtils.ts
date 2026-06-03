export interface ColumnGroup {
  label: string
  colSpan: number
}

export interface ExcelExportConfig {
  filename: string
  headers: string[]
  rows: (string | number)[][]
  columnGroups?: ColumnGroup[]
}

export interface PrintExportConfig {
  title: string
  headers: string[]
  rows: (string | number)[][]
  columnGroups?: ColumnGroup[]
}

// UTF-8 BOM ensures Excel displays Hebrew characters correctly
const UTF8_BOM = '﻿'

const escapeCell = (value: string | number): string => {
  const str = String(value)
  return `"${str.replace(/"/g, '""')}"`
}

export const exportToExcel = (config: ExcelExportConfig): void => {
  // For CSV, flatten group labels into header row (group structure is visual only)
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

const buildThead = (headers: string[], groups?: ColumnGroup[]): string => {
  if (!groups?.length) {
    return `<thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>`
  }
  // headers[0] is the primary column (rowspan=2), headers[1..] are sub-headers inside groups
  const firstCol = `<th rowspan="2" class="th-first">${headers[0]}</th>`
  const groupCells = groups.map((g) => `<th colspan="${g.colSpan}" class="th-group">${g.label}</th>`).join('')
  const subCells = headers.slice(1).map((h) => `<th>${h}</th>`).join('')
  return `<thead><tr>${firstCol}${groupCells}</tr><tr>${subCells}</tr></thead>`
}

// @page must be at top level (not inside @media print) for the browser to honour landscape
const PRINT_STYLES = `
  @page { size: A4 landscape; margin: 8mm; }
  * { box-sizing: border-box; }
  body {
    font-family: Arial, 'Arial Hebrew', sans-serif;
    direction: rtl;
    margin: 0;
    padding: 6px;
    font-size: 10px;
    color: #212529;
  }
  h2 { margin: 0 0 6px; font-size: 13px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; }
  th {
    background: #e9ecef;
    font-weight: 700;
    padding: 4px 5px;
    border: 1px solid #ced4da;
    text-align: center;
    font-size: 9px;
    white-space: nowrap;
  }
  td {
    padding: 3px 5px;
    border: 1px solid #dee2e6;
    text-align: right;
    font-size: 9px;
    white-space: nowrap;
  }
  .th-group {
    background: #d0e4f7;
    color: #1a5276;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    border-bottom: none;
  }
  .th-first { vertical-align: middle; background: #e9ecef; }
  tr:nth-child(even) td { background: #f8f9fa; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
`

export const exportToPrint = (config: PrintExportConfig): void => {
  const theadHtml = buildThead(config.headers, config.columnGroups)
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
    <table>${theadHtml}<tbody>${bodyRows}</tbody></table>
  </body>
</html>`

  const printWindow = window.open('about:blank', '_blank')
  if (!printWindow) return

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  printWindow.document.write(html)
  printWindow.document.close()

  let printed = false
  const doPrint = (): void => {
    if (printed || printWindow.closed) return
    printed = true
    printWindow.focus()
    printWindow.print()
  }

  printWindow.onload = doPrint
  // Fallback: some browsers fire load before we attach the handler
  setTimeout(doPrint, 400)
}
