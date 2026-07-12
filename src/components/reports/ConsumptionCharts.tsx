import { useState } from 'react'
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
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
import type { BarChartData, LineChartData } from '@/hooks/use-consumption-report'

interface ConsumptionChartsProps {
  barData: BarChartData[]
  lineData: LineChartData[]
  loading: boolean
  selectedItemId: string | null
}

export function ConsumptionCharts({
  barData,
  lineData,
  loading,
  selectedItemId,
}: ConsumptionChartsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true)
    try {
      const { error } =
        format === 'pdf'
          ? await exportConsumptionPdf(barData)
          : await exportConsumptionExcel(barData)
      if (error) throw error
    } catch {
      toast({ title: 'Erro ao exportar', variant: 'destructive' })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">
            Top 10 Itens Mais Consumidos (Período Selecionado)
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isExporting || barData.length === 0}
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
          {loading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : barData.length === 0 ? (
            <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">
                Nenhum consumo no período selecionado.
              </p>
            </div>
          ) : (
            <ChartContainer
              config={{ consumido: { label: 'Quantidade Saída', color: 'hsl(var(--primary))' } }}
              className="h-[400px] w-full"
            >
              <BarChart data={barData} layout="vertical" margin={{ left: 50 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={150}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => (v.length > 20 ? `${v.substring(0, 20)}...` : v)}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="consumido" fill="var(--color-consumido)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evolução de Consumo do Item Selecionado</CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedItemId ? (
            <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">
                Selecione um item para ver sua evolução.
              </p>
            </div>
          ) : loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : lineData.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">
                Sem consumo para este item no período.
              </p>
            </div>
          ) : (
            <ChartContainer
              config={{ quantity: { label: 'Quantidade', color: 'hsl(var(--primary))' } }}
              className="h-[300px] w-full"
            >
              <LineChart data={lineData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => {
                    const parts = v.split('-')
                    return `${parts[2]}/${parts[1]}`
                  }}
                />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  dataKey="quantity"
                  stroke="var(--color-quantity)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </>
  )
}
