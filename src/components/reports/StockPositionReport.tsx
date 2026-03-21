import { useState } from 'react'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Download, AlertCircle, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { exportStockReportPdf, exportStockReportExcel, ReportFilter } from '@/utils/exportPdf'
import { formatItemDisplay } from '@/utils/itemFormat'
import { useToast } from '@/hooks/use-toast'

export function StockPositionReport() {
  const { items } = useInventoryStore()
  const [filter, setFilter] = useState<ReportFilter>('all')
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const sortedItems = [...items].sort((a, b) =>
    formatItemDisplay(a).localeCompare(formatItemDisplay(b), 'pt-BR'),
  )

  const filteredItems = sortedItems.filter((item) => {
    const qty = Number(item.current_quantity) || 0
    const min = Number(item.min_quantity) || 0
    if (filter === 'critical') return qty > 0 && qty <= min
    if (filter === 'zero') return qty <= 0
    return true
  })

  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true)
    try {
      const { error } =
        format === 'pdf' ? await exportStockReportPdf(filter) : await exportStockReportExcel(filter)
      if (error) throw error
      toast({ title: 'Relatório gerado com sucesso!' })
    } catch (error) {
      toast({ title: 'Erro ao gerar relatório', variant: 'destructive' })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle>Posição de Estoque</CardTitle>
          <CardDescription>Visualize o saldo atual e gere relatórios filtrados.</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <Select value={filter} onValueChange={(v) => setFilter(v as ReportFilter)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os itens</SelectItem>
              <SelectItem value="critical">Estoque Crítico</SelectItem>
              <SelectItem value="zero">Estoque Zerado</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={isExporting} className="w-full sm:w-auto gap-2">
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isExporting ? 'Gerando...' : 'Exportar'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                Exportar como PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                Exportar como Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Mínimo</TableHead>
                <TableHead className="text-right">Atual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum item encontrado para o filtro selecionado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const qty = Number(item.current_quantity) || 0
                  const min = Number(item.min_quantity) || 0
                  const isZero = qty <= 0
                  const isCritical = qty > 0 && qty <= min

                  return (
                    <TableRow
                      key={item.id}
                      className={
                        isZero
                          ? 'bg-destructive/5 hover:bg-destructive/10'
                          : isCritical
                            ? 'bg-amber-500/5 hover:bg-amber-500/10'
                            : ''
                      }
                    >
                      <TableCell className="font-medium">{formatItemDisplay(item)}</TableCell>
                      <TableCell>
                        {isZero ? (
                          <Badge
                            variant="destructive"
                            className="gap-1 bg-red-600 hover:bg-red-700"
                          >
                            <AlertCircle className="h-3 w-3" /> Zerado
                          </Badge>
                        ) : isCritical ? (
                          <Badge
                            variant="outline"
                            className="gap-1 border-amber-500 text-amber-600 dark:text-amber-500"
                          >
                            <AlertTriangle className="h-3 w-3" /> Crítico
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="gap-1 border-emerald-500 text-emerald-600 dark:text-emerald-500"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Adequado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{min}</TableCell>
                      <TableCell className="text-right font-bold">{qty}</TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
