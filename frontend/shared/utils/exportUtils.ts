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
  const data = [config.headers, ...config.rows]
  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, config.sheetName ?? 'Sheet1')
  XLSX.writeFile(wb, `${config.filename}.xlsx`)
}

const PRINT_STYLES = `
  body { font-family: Arial, sans-serif; direction: rtl; margin: 24px; }
  h2 { margin-bottom: 16px; font-size: 18px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f1f3f5; font-weight: 600; padding: 8px 12px; border: 1px solid #dee2e6; text-align: right; }
  td { padding: 7px 12px; border: 1px solid #dee2e6; text-align: right; }
  tr:nth-child(even) td { background: #f8f9fa; }
  @media print { body { margin: 0; } }
`

export const exportToPrint = (config: PrintExportConfig): void => {
  const headerCells = config.headers.map((h) => `<th>${h}</th>`).join('')
  const bodyRows = config.rows
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
    .join('')

  const html = `
    <html dir="rtl">
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
      </body>
    </html>
  `

  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
  printWindow.close()
}
