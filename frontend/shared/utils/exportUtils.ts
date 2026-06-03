import * as XLSX from 'xlsx'

export interface ExcelExportConfig {
  filename: string
  sheetName?: string
  headers: string[]
  rows: (string | number)[][]
}

export interface PrintExportConfig {
  title: string
  headers: string[]
  rows: (string | number)[][]
}

export const exportToExcel = (config: ExcelExportConfig): void => {
  const wsData = [config.headers, ...config.rows]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, config.sheetName ?? 'Data')

  // Use Blob + anchor for reliable cross-browser download in Next.js
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${config.filename}.xlsx`
  anchor.click()
  URL.revokeObjectURL(url)
}

const PRINT_STYLES = `
  * { box-sizing: border-box; }
  body {
    font-family: Arial, 'Arial Hebrew', sans-serif;
    direction: rtl;
    margin: 16px;
    font-size: 12px;
  }
  h2 { margin: 0 0 12px; font-size: 16px; }
  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  th {
    background: #e9ecef;
    font-weight: 700;
    padding: 6px 8px;
    border: 1px solid #ced4da;
    text-align: right;
    white-space: nowrap;
    font-size: 11px;
  }
  td {
    padding: 5px 8px;
    border: 1px solid #dee2e6;
    text-align: right;
    word-break: break-word;
    font-size: 11px;
  }
  tr:nth-child(even) td { background: #f8f9fa; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  @media print {
    body { margin: 8px; }
    @page { margin: 10mm; size: A4 landscape; }
  }
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
    <script>
      window.onload = function() {
        window.print();
      };
    </script>
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
