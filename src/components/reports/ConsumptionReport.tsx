import { useState } from 'react'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { formatItemDisplay } from '@/utils/itemFormat'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, Loader2 } from 'lucide-react'
import { exportConsumptionPdf, exportConsumptionExcel } from '@/utils/exportPdf'
import { useToast } from '@/hooks/use-toast'

export function ConsumptionReport() {
  const { movements, items } = useInventoryStore()
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  // Calculate total consumption for the items
  const data = items
    .map((item) => {
      const consumed = movements
        .filter((m) => m.item_id === item.id && m.type === 'OUT')
        .reduce((acc, curr) => acc + Number(curr.quantity), 0)
      return { name: formatItemDisplay(item), consumido: consumed }
    })
    .sort((a, b) => b.consumido - a.consumido)
    .slice(0, 10)

  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true)
    try {
      const { error } =
        format === 'pdf' ? await exportConsumptionPdf(data) : await exportConsumptionExcel(data)
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
        <CardTitle className="text-lg">Top 10 Itens Mais Consumidos (Histórico Total)</CardTitle>
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
          config={{ consumido: { label: 'Quantidade Saída', color: 'hsl(var(--primary))' } }}
          className="h-[400px] w-full"
        >
          <BarChart data={data} layout="vertical" margin={{ left: 50 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis
              dataKey="name"
              type="category"
              width={150}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) =>
                value.length > 20 ? `${value.substring(0, 20)}...` : value
              }
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="consumido" fill="var(--color-consumido)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
