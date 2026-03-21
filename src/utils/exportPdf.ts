import { supabase } from '@/lib/supabase/client'
import { formatItemDisplay } from '@/utils/itemFormat'

export type ReportFilter = 'all' | 'critical' | 'zero'

export const exportStockReportPdf = async (
  filter: ReportFilter = 'all',
): Promise<{ error?: any }> => {
  const { data: latestItems, error } = await supabase.from('items').select('*')

  if (error || !latestItems) return { error: error || new Error('No data') }

  let filteredItems = latestItems
  if (filter === 'critical') {
    filteredItems = latestItems.filter(
      (item) =>
        (item.current_quantity ?? 0) <= (item.min_quantity ?? 0) &&
        (item.current_quantity ?? 0) > 0,
    )
  } else if (filter === 'zero') {
    filteredItems = latestItems.filter((item) => (item.current_quantity ?? 0) <= 0)
  }

  // Ensure alphabetical sorting by the new formatted name
  filteredItems.sort((a, b) => formatItemDisplay(a).localeCompare(formatItemDisplay(b), 'pt-BR'))

  const printWindow = window.open('', '_blank')
  if (!printWindow) return { error: new Error('Popup blocked') }

  const now = new Date()
  const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`

  let filterTitle = 'Completo'
  if (filter === 'critical') filterTitle = 'Estoque Crítico'
  if (filter === 'zero') filterTitle = 'Estoque Zerado'

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
            </tr>
          </thead>
          <tbody>
            ${filteredItems.length === 0 ? '<tr><td colspan="4" class="text-center">Nenhum item encontrado para este filtro.</td></tr>' : ''}
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
                }

                return `
                  <tr class="${rowClass}">
                    <td>${formatItemDisplay(item)} ${badge}</td>
                    <td>${item.unit_type || '-'}</td>
                    <td class="text-right">${min}</td>
                    <td class="text-right font-bold">${qty}</td>
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
