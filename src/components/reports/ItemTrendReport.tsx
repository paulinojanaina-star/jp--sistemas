import { useState } from 'react'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Download, Loader2 } from 'lucide-react'
import { exportTrendsPdf, exportTrendsExcel } from '@/utils/exportPdf'
import { useToast } from '@/hooks/use-toast'

export function ItemTrendReport() {
  const { movements, items } = useInventoryStore()
  const [isExporting, setIsExporting] = useState(false)
  const [selectedPoint, setSelectedPoint] = useState<any>(null)
  const { toast } = useToast()

  const data = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return d
  })
    .reverse()
    .map((date) => {
      const month = date.getMonth()
      const year = date.getFullYear()
      const label = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })

      const monthMovements = movements.filter((m) => {
        const md = new Date(m.created_at)
        return (
          md.getMonth() === month &&
          md.getFullYear() === year &&
          (m.type === 'OUT' || m.type === 'SPECIAL_OUT')
        )
      })

      const itemTotals = monthMovements.reduce(
        (acc, curr) => {
          const item = items.find((i) => i.id === curr.item_id)
          const price = item?.unit_price || 0
          const total = Number(curr.quantity) * price
          if (!acc[curr.item_id]) {
            acc[curr.item_id] = { name: item?.name || 'Desconhecido', total: 0 }
          }
          acc[curr.item_id].total += total
          return acc
        },
        {} as Record<string, { name: string; total: number }>,
      )

      const outs = Object.values(itemTotals).reduce((sum, item) => sum + item.total, 0)

      const topItems = Object.values(itemTotals)
        .sort((a, b) => b.total - a.total)
        .slice(0, 3)

      return { name: label, saidas: outs, topItems }
    })

  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true)
    try {
      const { error } =
        format === 'pdf' ? await exportTrendsPdf(data) : await exportTrendsExcel(data)
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
        <CardTitle className="text-lg">Tendência Financeira de Saídas (Últimos 6 meses)</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isExporting || data.length === 0}
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
        <ChartContainer
          config={{
            saidas: { label: 'Saídas (R$)', color: 'hsl(var(--primary))' },
          }}
          className="h-[400px] w-full cursor-pointer"
        >
          <LineChart
            data={data}
            margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
            onClick={(state) => {
              if (state && state.activePayload && state.activePayload.length > 0) {
                setSelectedPoint(state.activePayload[0].payload)
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis
              tickFormatter={(value) =>
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  notation: 'compact',
                }).format(value)
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value: any) =>
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      Number(value),
                    )
                  }
                />
              }
            />
            <Line
              type="monotone"
              dataKey="saidas"
              stroke="var(--color-saidas)"
              strokeWidth={2}
              activeDot={{ r: 8, className: 'cursor-pointer' }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>

      <Dialog open={!!selectedPoint} onOpenChange={(open) => !open && setSelectedPoint(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Top 3 Itens de Saída ({selectedPoint?.name})</DialogTitle>
            <DialogDescription>Itens com maior impacto financeiro neste período.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {selectedPoint?.topItems?.map((item: any, index: number) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-secondary/20 rounded-lg border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-primary">{index + 1}º</span>
                  <span className="font-medium text-sm">{item.name}</span>
                </div>
                <span className="font-bold text-sm">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    item.total,
                  )}
                </span>
              </div>
            ))}
            {(!selectedPoint?.topItems || selectedPoint.topItems.length === 0) && (
              <p className="text-center text-muted-foreground py-4 text-sm">
                Nenhuma saída registrada neste período.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
