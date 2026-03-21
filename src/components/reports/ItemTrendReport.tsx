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
import { Download, Loader2 } from 'lucide-react'
import { exportTrendsPdf, exportTrendsExcel } from '@/utils/exportPdf'
import { useToast } from '@/hooks/use-toast'

export function ItemTrendReport() {
  const { movements } = useInventoryStore()
  const [isExporting, setIsExporting] = useState(false)
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

      const outs = movements
        .filter((m) => {
          const md = new Date(m.created_at)
          return md.getMonth() === month && md.getFullYear() === year && m.type === 'OUT'
        })
        .reduce((acc, curr) => acc + Number(curr.quantity), 0)

      const ins = movements
        .filter((m) => {
          const md = new Date(m.created_at)
          return md.getMonth() === month && md.getFullYear() === year && m.type === 'IN'
        })
        .reduce((acc, curr) => acc + Number(curr.quantity), 0)

      return { name: label, entradas: ins, saidas: outs }
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
        <CardTitle className="text-lg">Tendência de Movimentações (Últimos 6 meses)</CardTitle>
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
            entradas: { label: 'Entradas', color: 'hsl(var(--secondary))' },
            saidas: { label: 'Saídas', color: 'hsl(var(--primary))' },
          }}
          className="h-[400px] w-full"
        >
          <LineChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="entradas"
              stroke="var(--color-entradas)"
              strokeWidth={2}
            />
            <Line type="monotone" dataKey="saidas" stroke="var(--color-saidas)" strokeWidth={2} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
