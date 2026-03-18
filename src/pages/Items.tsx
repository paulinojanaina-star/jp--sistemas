import { useState } from 'react'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { ItemFormModal } from '@/components/ItemFormModal'
import { ItemRowActions } from '@/components/ItemRowActions'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Search, AlertCircle, FileText } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function Items() {
  const { items } = useInventoryStore()
  const { toast } = useToast()
  const [search, setSearch] = useState('')

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()),
  )

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast({
        title: 'Erro de Pop-up',
        description: 'Por favor, permita a abertura de pop-ups para exportar o relatório PDF.',
        variant: 'destructive',
      })
      return
    }

    const now = new Date().toLocaleString('pt-BR')

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>JP_Sistemas_Relatorio_Estoque</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 40px;
              color: #1e293b;
              line-height: 1.5;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
            }
            h1 {
              color: #0f172a;
              margin: 0 0 10px 0;
              font-size: 24px;
            }
            .meta {
              color: #64748b;
              font-size: 14px;
              margin: 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 12px;
              text-align: left;
              font-size: 14px;
            }
            th {
              background-color: #f8fafc;
              font-weight: 600;
              color: #334155;
            }
            .text-right {
              text-align: right;
            }
            .low-stock {
              color: #dc2626;
              font-weight: 700;
            }
            @media print {
              body { padding: 0; }
              .header { margin-bottom: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>JP Sistemas - Relatório de Estoque Atual</h1>
            <p class="meta">Gerado em: ${now}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Nome do Item</th>
                <th>Categoria</th>
                <th>Unidade</th>
                <th class="text-right">Quantidade Atual</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.category || '-'}</td>
                  <td>${item.unit_type || '-'}</td>
                  <td class="text-right ${item.current_quantity < item.min_quantity ? 'low-stock' : ''}">
                    ${item.current_quantity}
                  </td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()

    // Short delay to ensure the content is rendered before printing
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 300)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Catálogo de Itens</h2>
          <p className="text-muted-foreground">
            Gerencie todos os materiais e medicamentos da unidade.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={handleExportPDF}
            variant="outline"
            className="w-full sm:w-auto gap-2 bg-white dark:bg-slate-950"
          >
            <FileText size={16} /> Exportar PDF
          </Button>
          <div className="w-full sm:w-auto">
            <ItemFormModal />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome ou categoria..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Item</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Estoque Atual</TableHead>
                <TableHead className="w-[200px]">Nível de Estoque</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Nenhum item encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.current_quantity < item.min_quantity
                  const percentage = Math.min(
                    100,
                    Math.max(0, (item.current_quantity / (item.min_quantity * 2 || 1)) * 100),
                  )

                  return (
                    <TableRow
                      key={item.id}
                      className={isLow ? 'bg-red-50/30 dark:bg-red-950/10 hover:bg-red-50/50' : ''}
                    >
                      <TableCell>
                        <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          {item.name}
                          {isLow && <AlertCircle className="h-4 w-4 text-destructive" />}
                        </div>
                        <div className="text-xs text-muted-foreground">{item.unit_type}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-mono text-base ${isLow ? 'text-destructive font-bold' : 'font-medium'}`}
                        >
                          {item.current_quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                            <span>Min: {item.min_quantity}</span>
                            <span>{percentage > 100 ? '+100' : Math.round(percentage)}%</span>
                          </div>
                          <Progress
                            value={percentage}
                            className={`h-1.5 ${isLow ? 'bg-red-100 dark:bg-red-950 [&>div]:bg-destructive' : '[&>div]:bg-emerald-500'}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <ItemRowActions item={item} />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
