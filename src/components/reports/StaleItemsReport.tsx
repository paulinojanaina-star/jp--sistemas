import { useState, useMemo } from 'react'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Download, AlertCircle, Clock } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function StaleItemsReport() {
  const { items, movements } = useInventoryStore()
  const { toast } = useToast()
  const [threshold, setThreshold] = useState<number>(30)

  const staleItems = useMemo(() => {
    const now = new Date()
    return items
      .filter((item) => item.current_quantity > 0)
      .map((item) => {
        const outs = movements.filter((m) => m.item_id === item.id && m.type === 'OUT')
        let lastDateStr = item.created_at

        if (outs.length > 0) {
          lastDateStr = outs.reduce((latest, current) =>
            new Date(current.created_at) > new Date(latest.created_at) ? current : latest,
          ).created_at
        }

        const lastDate = new Date(lastDateStr || now)
        const daysInactive = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24))

        return {
          ...item,
          lastOutDateStr: outs.length > 0 ? lastDateStr : null,
          daysInactive,
        }
      })
      .filter((item) => item.daysInactive >= threshold)
      .sort((a, b) => b.daysInactive - a.daysInactive)
  }, [items, movements, threshold])

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast({
        title: 'Erro de Pop-up',
        description: 'Permita a abertura de pop-ups para exportar o relatório.',
        variant: 'destructive',
      })
      return
    }

    const now = new Date()
    const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>Relatório de Itens Sem Movimentação</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; font-size: 14px; }
            th { background-color: #f8fafc; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
          </style>
        </head>
        <body>
          <h2>Itens Sem Movimentação - Mais de ${threshold} dias</h2>
          <p>Emissão: ${formattedDate}</p>
          <table>
            <thead>
              <tr>
                <th>Nome do Material</th>
                <th class="text-right">Saldo Atual</th>
                <th class="text-center">Data da Última Saída</th>
                <th class="text-right">Dias de Inatividade</th>
              </tr>
            </thead>
            <tbody>
              ${staleItems.length === 0 ? '<tr><td colspan="4" class="text-center">Todos os itens possuem movimentação recente.</td></tr>' : ''}
              ${staleItems
                .map(
                  (item) => `
                <tr>
                  <td>${item.name}</td>
                  <td class="text-right font-bold">${item.current_quantity}</td>
                  <td class="text-center">${item.lastOutDateStr ? new Date(item.lastOutDateStr).toLocaleDateString('pt-BR') : 'Sem saídas'}</td>
                  <td class="text-right">${item.daysInactive} dias</td>
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
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 300)
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
        <div className="space-y-1">
          <CardTitle className="text-lg">Itens Ociosos no Estoque</CardTitle>
          <CardDescription>Materiais em estoque que não registraram saída recente.</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Select value={threshold.toString()} onValueChange={(v) => setThreshold(Number(v))}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Período de inatividade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Mais de 30 dias</SelectItem>
              <SelectItem value="60">Mais de 60 dias</SelectItem>
              <SelectItem value="90">Mais de 90 dias</SelectItem>
              <SelectItem value="180">Mais de 180 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleExportPDF}
            variant="outline"
            className="gap-2 bg-white dark:bg-slate-950"
          >
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Nome do Material</TableHead>
              <TableHead className="text-right">Saldo Atual</TableHead>
              <TableHead className="text-center">Data da Última Saída</TableHead>
              <TableHead className="text-right">Dias de Inatividade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staleItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Clock className="h-8 w-8 opacity-20" />
                    <p>Todos os itens em estoque possuem movimentação recente.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              staleItems.map((item) => {
                const isSevere = item.daysInactive >= 90
                return (
                  <TableRow
                    key={item.id}
                    className={
                      isSevere ? 'bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/50' : ''
                    }
                  >
                    <TableCell>
                      <div className="font-medium flex items-center gap-2">
                        {item.name}
                        {isSevere && (
                          <AlertCircle
                            className="h-4 w-4 text-amber-500"
                            title="Alerta de ociosidade longa"
                          />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{item.unit_type}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {item.current_quantity}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {item.lastOutDateStr ? (
                        new Date(item.lastOutDateStr).toLocaleDateString('pt-BR')
                      ) : (
                        <span className="text-muted-foreground italic">Sem registros</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={isSevere ? 'destructive' : 'outline'}
                        className={
                          isSevere
                            ? 'bg-amber-500 hover:bg-amber-600'
                            : 'text-amber-700 border-amber-200 bg-amber-50'
                        }
                      >
                        {item.daysInactive} dias
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
