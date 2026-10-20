import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface ExportColumn<T = any> {
  header: string
  key?: string
  accessor?: (item: T, index: number) => string | number | null | undefined
  width?: number
  align?: 'left' | 'center' | 'right'
}

export interface ExportFilterInfo {
  label: string
  value: string | number | null | undefined
}

export interface GenericExportOptions<T = any> {
  filename: string
  title: string
  subtitle?: string
  filters?: ExportFilterInfo[]
  columns: ExportColumn<T>[]
  data: T[]
  footerText?: string
  orientation?: 'portrait' | 'landscape'
}

function formatSafeValue(val: any): string | number {
  if (val === null || val === undefined) return '-'
  if (typeof val === 'number') return val
  return String(val)
}

/**
 * Exporta uma lista genérica para Excel (.xlsx)
 */
export function exportToExcel<T>({
  filename,
  title,
  columns,
  data,
  filters,
}: GenericExportOptions<T>) {
  const wb = XLSX.utils.book_new()

  // Monta linhas da planilha
  const rows: any[][] = []

  // Título e filtros no topo
  rows.push([title])
  rows.push([`Gerado em: ${new Date().toLocaleString('pt-BR')}`])

  if (filters && filters.length > 0) {
    const activeFilters = filters.filter(
      (f) => f.value !== undefined && f.value !== null && f.value !== '',
    )
    if (activeFilters.length > 0) {
      rows.push([
        'Filtros aplicados: ' + activeFilters.map((f) => `${f.label}: ${f.value}`).join(' | '),
      ])
    }
  }

  // Linha em branco antes da tabela
  rows.push([])

  // Cabeçalho da tabela
  const headerRow = columns.map((col) => col.header)
  rows.push(headerRow)

  // Dados
  data.forEach((item, index) => {
    const row = columns.map((col) => {
      let val: any
      if (col.accessor) {
        val = col.accessor(item, index)
      } else if (col.key) {
        val = (item as any)[col.key]
      }
      return val === null || val === undefined ? '' : val
    })
    rows.push(row)
  })

  const ws = XLSX.utils.aoa_to_sheet(rows)

  // Auto-ajuste de largura de colunas
  const colWidths = columns.map((col, cIdx) => {
    let maxLen = col.header.length
    data.forEach((item, rIdx) => {
      let val = ''
      if (col.accessor) {
        val = String(col.accessor(item, rIdx) ?? '')
      } else if (col.key) {
        val = String((item as any)[col.key] ?? '')
      }
      if (val.length > maxLen) maxLen = Math.min(val.length, 50)
    })
    return { wch: Math.max(maxLen + 3, col.width ? Math.floor(col.width / 6) : 12) }
  })
  ws['!cols'] = colWidths

  const sheetName = title.slice(0, 31).replace(/[:\\/?*[\]]/g, '') || 'Dados'
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  const dateStr = new Date().toISOString().split('T')[0]
  const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}-${dateStr}.xlsx`

  XLSX.writeFile(wb, cleanFilename)
}

/**
 * Exporta uma lista genérica para PDF com jspdf e autotable
 */
export function exportToPdf<T>({
  filename,
  title,
  subtitle,
  filters,
  columns,
  data,
  footerText,
  orientation = 'portrait',
}: GenericExportOptions<T>) {
  const doc = new jsPDF({
    orientation,
    unit: 'pt',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Cabeçalho institucional do relatório
  doc.setFontSize(15)
  doc.setTextColor(30, 41, 59) // slate-800
  doc.setFont('helvetica', 'bold')
  doc.text(title, 40, 42)

  let currentY = 56

  if (subtitle) {
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139) // slate-500
    doc.setFont('helvetica', 'normal')
    doc.text(subtitle, 40, currentY)
    currentY += 13
  }

  // Metadados: data/hora e filtros
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  const metaText = `Gerado em: ${new Date().toLocaleString('pt-BR')}  •  Total de registros: ${data.length}`
  doc.text(metaText, 40, currentY)
  currentY += 12

  if (filters && filters.length > 0) {
    const activeFilters = filters.filter(
      (f) => f.value !== undefined && f.value !== null && f.value !== '',
    )
    if (activeFilters.length > 0) {
      doc.setTextColor(71, 85, 105)
      doc.setFont('helvetica', 'bold')
      doc.text('Filtros: ', 40, currentY)
      const labelWidth = doc.getTextWidth('Filtros: ')
      doc.setFont('helvetica', 'normal')
      const filterSummary = activeFilters.map((f) => `${f.label}: ${f.value}`).join('  |  ')
      doc.text(filterSummary, 40 + labelWidth, currentY, { maxWidth: pageWidth - 80 - labelWidth })
      currentY += 14
    }
  }

  // Linha separadora discreta
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.75)
  doc.line(40, currentY + 2, pageWidth - 40, currentY + 2)
  currentY += 8

  // Cabeçalhos e linhas da tabela
  const tableHeaders = columns.map((col) => col.header)
  const tableRows = data.map((item, index) => {
    return columns.map((col) => {
      let val: any
      if (col.accessor) {
        val = col.accessor(item, index)
      } else if (col.key) {
        val = (item as any)[col.key]
      }
      return formatSafeValue(val)
    })
  })

  // Estilos de alinhamento por coluna
  const columnStyles: { [key: number]: any } = {}
  columns.forEach((col, idx) => {
    if (col.align) {
      columnStyles[idx] = { halign: col.align }
    }
  })

  autoTable(doc, {
    startY: currentY,
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 4,
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [15, 23, 42], // slate-900 elegante
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles,
    margin: { left: 40, right: 40, bottom: 40 },
    didDrawPage: (data) => {
      // Rodapé da página
      const pageStr = `Página ${data.pageNumber}`
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.text(pageStr, pageWidth - 40 - doc.getTextWidth(pageStr), pageHeight - 20)

      const footerLabel = footerText || 'JP Sistemas • Controle de Estoque & Suprimentos'
      doc.text(footerLabel, 40, pageHeight - 20)
    },
  })

  const dateStr = new Date().toISOString().split('T')[0]
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}-${dateStr}.pdf`

  doc.save(cleanFilename)
}
