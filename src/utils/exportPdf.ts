import { supabase } from '@/lib/supabase/client'
import { formatItemDisplay } from '@/utils/itemFormat'
import { getNearestExpiry } from '@/utils/expiryLogic'

export type ReportFilter = 'all' | 'critical' | 'zero' | 'expiring' | 'expired'

const downloadExcel = (
  filename: string,
  headers: string[],
  rows: (string | number | undefined | null)[][],
) => {
  const escapeCell = (cell: any) => {
    const stringValue = String(cell ?? '')
    if (stringValue.includes(';') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }
  const csvRows = [headers, ...rows]
  const csvContent = '\uFEFF' + csvRows.map((row) => row.map(escapeCell).join(';')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  return { error: null }
}

export const exportGenericPdf = async (
  title: string,
  headers: string[],
  rows: (string | number | undefined | null)[][],
) => {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return { error: new Error('Popup blocked') }

  const now = new Date()
  const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>JP Sistemas - ${title}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 40px; color: #1e293b; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
          h1 { color: #0f172a; margin: 0 0 10px 0; font-size: 24px; }
          .meta { color: #64748b; font-size: 14px; margin: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; font-size: 14px; }
          th { background-color: #f8fafc; font-weight: 600; color: #334155; }
          .text-right { text-align: right; }
          @media print {
            body { padding: 0; }
            .header { margin-bottom: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>JP Sistemas - ${title}</h1>
          <p class="meta">Data de emissão: ${formattedDate}</p>
        </div>
        <table>
          <thead>
            <tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.length === 0 ? `<tr><td colspan="${headers.length}" style="text-align:center">Nenhum registro encontrado.</td></tr>` : ''}
            ${rows
              .map(
                (row) =>
                  `<tr>${row
                    .map((cell) => {
                      const strVal = String(cell ?? '')
                      const isNum = !isNaN(Number(cell)) && strVal.trim() !== ''
                      return `<td class="${isNum ? 'text-right' : ''}">${strVal}</td>`
                    })
                    .join('')}</tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 300)
  return { error: null }
}

export const exportStockReportPdf = async (
  filter: ReportFilter = 'all',
): Promise<{ error?: any }> => {
  const { data: latestItems, error } = await supabase.from('items').select('*')

  if (error || !latestItems) return { error: error || new Error('No data') }

  let movementsData: any[] = []
  if (filter === 'expiring' || filter === 'expired') {
    const { data: movements } = await supabase.from('inventory_movements').select('*')
    movementsData = movements || []
  }

  let filteredItems = latestItems
  const now = new Date()
  const days120 = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000)

  if (filter === 'critical') {
    filteredItems = latestItems.filter(
      (item) =>
        (item.current_quantity ?? 0) <= (item.min_quantity ?? 0) &&
        (item.current_quantity ?? 0) > 0,
    )
  } else if (filter === 'zero') {
    filteredItems = latestItems.filter((item) => (item.current_quantity ?? 0) <= 0)
  } else if (filter === 'expiring') {
    filteredItems = latestItems.filter((item) => {
      const nearest = getNearestExpiry(item, movementsData)
      if (!nearest) return false
      return nearest.date > now && nearest.date <= days120
    })
  } else if (filter === 'expired') {
    filteredItems = latestItems.filter((item) => {
      const nearest = getNearestExpiry(item, movementsData)
      if (!nearest) return false
      return nearest.date <= now
    })
  }

  // Ensure alphabetical sorting by the new formatted name
  filteredItems.sort((a, b) => formatItemDisplay(a).localeCompare(formatItemDisplay(b), 'pt-BR'))

  const printWindow = window.open('', '_blank')
  if (!printWindow) return { error: new Error('Popup blocked') }

  const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`

  let filterTitle = 'Completo'
  if (filter === 'critical') filterTitle = 'Estoque Crítico'
  if (filter === 'zero') filterTitle = 'Estoque Zerado'
  if (filter === 'expiring') filterTitle = 'A Vencer (120 dias)'
  if (filter === 'expired') filterTitle = 'Vencidos'

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>JP Sistemas - Relatório de Estoque - ${filterTitle}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 40px; color: #1e293b; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
          h1 { color: #0f172a; margin: 0 0 10px 0; font-size: 24px; }
          .meta { color: #64748b; font-size: 14px; margin: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; font-size: 14px; }
          th { background-color: #f8fafc; font-weight: 600; color: #334155; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .low-stock { color: #9a3412; background-color: #fffbeb; }
          .zero-stock { color: #991b1b; background-color: #fef2f2; }
          .status-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-left: 8px; }
          .badge-zero { background-color: #dc2626; color: white; }
          .badge-critical { background-color: #f59e0b; color: white; }
          .badge-ok { background-color: #10b981; color: white; }
          @media print {
            body { padding: 0; }
            .header { margin-bottom: 20px; }
            .low-stock { color: #9a3412 !important; background-color: #fffbeb !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .zero-stock { color: #991b1b !important; background-color: #fef2f2 !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .badge-zero { background-color: #dc2626 !important; color: white !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .badge-critical { background-color: #f59e0b !important; color: white !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .badge-ok { background-color: #10b981 !important; color: white !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>JP Sistemas - Relatório de Estoque - ${filterTitle}</h1>
          <p class="meta">Data de emissão: ${formattedDate}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Nome do Item</th>
              <th>Unidade</th>
              <th class="text-right">Estoque Mínimo</th>
              <th class="text-right">Quantidade Atual</th>
              ${['expiring', 'expired'].includes(filter) ? '<th class="text-right">Vencimento</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${filteredItems.length === 0 ? `<tr><td colspan="${['expiring', 'expired'].includes(filter) ? 5 : 4}" class="text-center">Nenhum item encontrado para este filtro.</td></tr>` : ''}
            ${filteredItems
              .map((item) => {
                const qty = item.current_quantity ?? 0
                const min = item.min_quantity ?? 0
                const isZero = qty <= 0
                const isCritical = qty > 0 && qty <= min

                let rowClass = ''
                let badge = '<span class="status-badge badge-ok">ADEQUADO</span>'

                if (isZero) {
                  rowClass = 'zero-stock'
                  badge = '<span class="status-badge badge-zero">ZERADO</span>'
                } else if (isCritical) {
                  rowClass = 'low-stock'
                  badge = '<span class="status-badge badge-critical">CRÍTICO</span>'
                } else if (filter === 'expiring') {
                  rowClass = 'low-stock'
                  badge = '<span class="status-badge badge-critical">A VENCER</span>'
                } else if (filter === 'expired') {
                  rowClass = 'zero-stock'
                  badge = '<span class="status-badge badge-zero">VENCIDO</span>'
                }

                let expiryColumn = ''
                if (['expiring', 'expired'].includes(filter)) {
                  const nearest = getNearestExpiry(item, movementsData)
                  const expiryStr = nearest ? nearest.date.toLocaleDateString('pt-BR') : '-'
                  expiryColumn = `<td class="text-right">${expiryStr}</td>`
                }

                return `
                  <tr class="${rowClass}">
                    <td>${formatItemDisplay(item)} ${badge}</td>
                    <td>${item.unit_type || '-'}</td>
                    <td class="text-right">${min}</td>
                    <td class="text-right font-bold">${qty}</td>
                    ${expiryColumn}
                  </tr>
                `
              })
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()

  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 300)

  return {}
}

export const exportStockReportExcel = async (filter: ReportFilter = 'all') => {
  const { data: latestItems, error } = await supabase.from('items').select('*')
  if (error || !latestItems) return { error: error || new Error('No data') }

  let movementsData: any[] = []
  if (filter === 'expiring' || filter === 'expired') {
    const { data: movements } = await supabase.from('inventory_movements').select('*')
    movementsData = movements || []
  }

  let filteredItems = latestItems
  const now = new Date()
  const days120 = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000)

  if (filter === 'critical') {
    filteredItems = latestItems.filter(
      (item) =>
        (item.current_quantity ?? 0) <= (item.min_quantity ?? 0) &&
        (item.current_quantity ?? 0) > 0,
    )
  } else if (filter === 'zero') {
    filteredItems = latestItems.filter((item) => (item.current_quantity ?? 0) <= 0)
  } else if (filter === 'expiring') {
    filteredItems = latestItems.filter((item) => {
      const nearest = getNearestExpiry(item, movementsData)
      if (!nearest) return false
      return nearest.date > now && nearest.date <= days120
    })
  } else if (filter === 'expired') {
    filteredItems = latestItems.filter((item) => {
      const nearest = getNearestExpiry(item, movementsData)
      if (!nearest) return false
      return nearest.date <= now
    })
  }

  filteredItems.sort((a, b) => formatItemDisplay(a).localeCompare(formatItemDisplay(b), 'pt-BR'))

  const headers = ['Nome do Item', 'Unidade', 'Estoque Mínimo', 'Quantidade Atual', 'Status']
  if (['expiring', 'expired'].includes(filter)) {
    headers.push('Vencimento')
  }

  const rows = filteredItems.map((item) => {
    const qty = item.current_quantity ?? 0
    const min = item.min_quantity ?? 0
    let status = 'ADEQUADO'
    if (qty <= 0) status = 'ZERADO'
    else if (qty <= min) status = 'CRÍTICO'
    else if (filter === 'expiring') status = 'A VENCER'
    else if (filter === 'expired') status = 'VENCIDO'

    const row = [formatItemDisplay(item), item.unit_type || '-', min, qty, status]

    if (['expiring', 'expired'].includes(filter)) {
      const nearest = getNearestExpiry(item, movementsData)
      row.push(nearest ? nearest.date.toLocaleDateString('pt-BR') : '-')
    }

    return row
  })

  return downloadExcel(`Estoque_${filter}`, headers, rows)
}

export const exportPurchaseSuggestionPdf = async (
  suggestions: Array<any>,
): Promise<{ error?: any }> => {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return { error: new Error('Popup blocked') }

  const now = new Date()
  const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>JP Sistemas - Sugestão de Compra</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 40px; color: #1e293b; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
          h1 { color: #0f172a; margin: 0 0 10px 0; font-size: 24px; }
          .meta { color: #64748b; font-size: 14px; margin: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; font-size: 14px; }
          th { background-color: #f8fafc; font-weight: 600; color: #334155; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-muted { color: #64748b; }
          .highlight { background-color: #f0fdf4; color: #15803d; font-weight: bold; }
          .edited { background-color: #eff6ff; color: #1d4ed8; font-weight: bold; }
          @media print {
            body { padding: 0; }
            .header { margin-bottom: 20px; }
            .highlight { background-color: #f0fdf4 !important; color: #15803d !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .edited { background-color: #eff6ff !important; color: #1d4ed8 !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>JP Sistemas - Relatório de Sugestão de Compra</h1>
          <p class="meta">Data de emissão: ${formattedDate}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Nome do Item</th>
              <th>Unidade</th>
              <th class="text-right">Estoque Mínimo</th>
              <th class="text-right">Média Mensal</th>
              <th class="text-right">Estoque Atual</th>
              <th class="text-right">Sugestão Original</th>
              <th class="text-right">Qtd Comprar</th>
            </tr>
          </thead>
          <tbody>
            ${suggestions.length === 0 ? '<tr><td colspan="7" class="text-center">Nenhum item com necessidade de compra.</td></tr>' : ''}
            ${suggestions
              .map((item) => {
                const isEdited = item.finalSuggestion !== item.suggestion
                const finalQtd = item.finalSuggestion ?? item.suggestion
                const highlightClass = isEdited ? 'edited' : 'highlight'

                return `
                <tr>
                  <td>${item.formattedName || item.name}</td>
                  <td>${item.unit_type || '-'}</td>
                  <td class="text-right">${item.min_quantity}</td>
                  <td class="text-right">${item.monthlyConsumption}</td>
                  <td class="text-right">${item.current_quantity}</td>
                  <td class="text-right text-muted">${item.suggestion}</td>
                  <td class="text-right ${highlightClass}">+${finalQtd}</td>
                </tr>
              `
              })
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()

  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 300)

  return {}
}

export const exportPurchaseSuggestionExcel = async (suggestions: Array<any>) => {
  const headers = [
    'Nome do Item',
    'Unidade',
    'Estoque Mínimo',
    'Média Mensal',
    'Estoque Atual',
    'Sugestão Original',
    'Qtd Comprar',
  ]
  const rows = suggestions.map((item) => [
    item.formattedName || item.name,
    item.unit_type || '-',
    item.min_quantity,
    item.monthlyConsumption,
    item.current_quantity,
    item.suggestion,
    item.finalSuggestion ?? item.suggestion,
  ])
  return downloadExcel('Sugestao_Compra', headers, rows)
}

export const exportConsumptionPdf = async (data: Array<any>) => {
  return exportGenericPdf(
    'Consumo Médio (Top 10)',
    ['Nome do Item', 'Quantidade Saída (Total)'],
    data.map((d) => [d.name, d.consumido]),
  )
}

export const exportConsumptionExcel = async (data: Array<any>) => {
  return downloadExcel(
    'Consumo_Medio',
    ['Nome do Item', 'Quantidade Saída (Total)'],
    data.map((d) => [d.name, d.consumido]),
  )
}

export const exportTrendsPdf = async (data: Array<any>) => {
  return exportGenericPdf(
    'Tendência de Movimentações',
    ['Período', 'Entradas', 'Saídas'],
    data.map((d) => [d.name, d.entradas, d.saidas]),
  )
}

export const exportTrendsExcel = async (data: Array<any>) => {
  return downloadExcel(
    'Tendencia_Movimentacoes',
    ['Período', 'Entradas', 'Saídas'],
    data.map((d) => [d.name, d.entradas, d.saidas]),
  )
}

export const exportStaleItemsPdf = async (data: Array<any>) => {
  return exportGenericPdf(
    'Itens sem Movimentação',
    ['Item', 'Dias Ocioso', 'Estoque Atual'],
    data.map((d) => [formatItemDisplay(d), d.daysStale, d.current_quantity]),
  )
}

export const exportStaleItemsExcel = async (data: Array<any>) => {
  return downloadExcel(
    'Itens_Sem_Movimentacao',
    ['Item', 'Dias Ocioso', 'Estoque Atual'],
    data.map((d) => [formatItemDisplay(d), d.daysStale, d.current_quantity]),
  )
}
