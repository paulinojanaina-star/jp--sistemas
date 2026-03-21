import { useState } from 'react'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatItemDisplay } from '@/utils/itemFormat'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, Loader2 } from 'lucide-react'
import { exportStaleItemsPdf, exportStaleItemsExcel } from '@/utils/exportPdf'
import { useToast } from '@/hooks/use-toast'

export function StaleItemsReport() {
  const { items, movements } = useInventoryStore()
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const now = new Date()
  const staleItems = items
    .map((item) => {
      const outs = movements.filter((m) => m.item_id === item.id && m.type === 'OUT')
      let lastDateStr = item.created_at
      if (outs.length > 0) {
        lastDateStr = outs.reduce((latest, current) =>
          new Date(current.created_at) > new Date(latest.created_at) ? current : latest,
        ).created_at
      }
      const days = Math.floor(
        (now.getTime() - new Date(lastDateStr || now).getTime()) / (1000 * 3600 * 24),
      )
      return { ...item, daysStale: days }
    })
    .filter((item) => item.daysStale >= 90 && Number(item.current_quantity) > 0)
    .sort((a, b) => b.daysStale - a.daysStale)

  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true)
    try {
      const { error } =
        format === 'pdf'
          ? await exportStaleItemsPdf(staleItems)
          : await exportStaleItemsExcel(staleItems)
      if (error) throw error
    } catch (e) {
      toast({ title: 'Erro ao exportar', variant: 'destructive' })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Itens sem Movimentação (&gt; 90 dias)</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isExporting || staleItems.length === 0}
              className="h-8"
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              <span className="hidden sm:inline">Exportar</span>
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
      </CardHeader>
      <CardContent>
        {staleItems.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhum item ocioso encontrado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Dias Ocioso</TableHead>
                <TableHead className="text-right">Estoque Atual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staleItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{formatItemDisplay(item)}</TableCell>
                  <TableCell className="text-right text-amber-600 font-bold">
                    {item.daysStale} dias
                  </TableCell>
                  <TableCell className="text-right">{item.current_quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
