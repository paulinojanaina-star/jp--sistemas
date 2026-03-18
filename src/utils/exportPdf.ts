import { supabase } from '@/lib/supabase/client'

export const exportStockReportPdf = async (): Promise<{ error?: any }> => {
  const { data: latestItems, error } = await supabase.from('items').select('*').order('name')

  if (error || !latestItems) return { error: error || new Error('No data') }

  const printWindow = window.open('', '_blank')
  if (!printWindow) return { error: new Error('Popup blocked') }

  const now = new Date()
  const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>JP Sistemas - Relatório de Estoque Atual</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 40px; color: #1e293b; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
          h1 { color: #0f172a; margin: 0 0 10px 0; font-size: 24px; }
          .meta { color: #64748b; font-size: 14px; margin: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; font-size: 14px; }
          th { background-color: #f8fafc; font-weight: 600; color: #334155; }
          .text-right { text-align: right; }
          .low-stock { color: #dc2626; font-weight: 700; background-color: #fef2f2; }
          .low-stock-label { display: inline-block; padding: 2px 6px; background-color: #dc2626; color: white; border-radius: 4px; font-size: 10px; font-weight: bold; margin-left: 8px; }
          @media print {
            body { padding: 0; }
            .header { margin-bottom: 20px; }
            .low-stock { color: #dc2626 !important; background-color: #fef2f2 !important; print-color-adjust: exact; }
            .low-stock-label { background-color: #dc2626 !important; color: white !important; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>JP Sistemas - Relatório de Estoque Atual</h1>
          <p class="meta">Data de emissão: ${formattedDate}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Nome do Item</th>
              <th>Unidade</th>
              <th class="text-right">Quantidade Atual</th>
            </tr>
          </thead>
          <tbody>
            ${latestItems
              .map((item) => {
                const isLow = (item.current_quantity ?? 0) <= (item.min_quantity ?? 0)
                return `
                  <tr class="${isLow ? 'low-stock' : ''}">
                    <td>${item.name} ${isLow ? '<span class="low-stock-label">ESTOQUE BAIXO</span>' : ''}</td>
                    <td>${item.unit_type || '-'}</td>
                    <td class="text-right">${item.current_quantity ?? 0}</td>
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
