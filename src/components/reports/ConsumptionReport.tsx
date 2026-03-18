import { useState, useCallback, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { RefreshCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { useNotificationStore } from '@/stores/useNotificationStore'

interface ConsumptionData {
  id: string
  name: string
  unit_type: string
  total: number
  average: number
  periodLabel: string
}

export function ConsumptionReport() {
  const { toast } = useToast()
  const { notifications } = useNotificationStore()

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const to = new Date()
    const from = new Date()
    from.setDate(to.getDate() - 30)
    return { from, to }
  })
  const [data, setData] = useState<ConsumptionData[]>([])
  const [loading, setLoading] = useState(false)

  const activeAlerts = useMemo(() => {
    return new Set(
      notifications
        .filter((n) => !n.read_at && n.type === 'CONSUMPTION_ALERT')
        .map((n) => n.item_id),
    )
  }, [notifications])

  const fetchData = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) return
    setLoading(true)

    try {
      const start = new Date(dateRange.from)
      start.setHours(0, 0, 0, 0)
      const end = new Date(dateRange.to)
      end.setHours(23, 59, 59, 999)

      const [{ data: moves, error: mErr }, { data: items, error: iErr }] = await Promise.all([
        supabase
          .from('inventory_movements')
          .select('item_id, quantity')
          .eq('type', 'OUT')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString()),
        supabase.from('items').select('id, name, unit_type'),
      ])

      if (mErr || iErr) throw new Error('Falha ao buscar dados')

      const grouped = new Map<string, number>()
      moves?.forEach((m) => {
        grouped.set(m.item_id, (grouped.get(m.item_id) || 0) + Number(m.quantity))
      })

      const days = Math.max(
        1,
        Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
      )
      const isMonthly = days >= 30

      const result = Array.from(grouped.entries())
        .map(([itemId, total]) => {
          const item = items?.find((i) => i.id === itemId)
          return {
            id: itemId,
            name: item?.name || 'Item Excluído',
            unit_type: item?.unit_type || '-',
            total,
            average: isMonthly ? (total / days) * 30 : total / days,
            periodLabel: isMonthly ? 'mês' : 'dia',
          }
        })
        .sort((a, b) => b.total - a.total)

      setData(result)
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [dateRange, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
        <div className="space-y-1">
          <CardTitle className="text-lg">Consumo Médio de Materiais</CardTitle>
          <CardDescription>Análise de saída média de itens no período selecionado.</CardDescription>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <DatePickerWithRange
            date={dateRange}
            setDate={setDateRange}
            className="flex-1 sm:w-auto"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={loading}
            title="Atualizar dados"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Item</TableHead>
              <TableHead>Unidade de Medida</TableHead>
              <TableHead className="text-right">Saída Total</TableHead>
              <TableHead className="text-right">Média de Saída</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[80px]" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-5 w-[60px] ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-5 w-[80px] ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  Nenhuma movimentação de saída encontrada para este período.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {row.name}
                      {activeAlerts.has(row.id) && (
                        <Badge
                          variant="destructive"
                          className="text-[10px] h-5 px-1.5 py-0 font-medium"
                        >
                          Alerta de Consumo
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.unit_type}</TableCell>
                  <TableCell className="text-right font-mono font-medium">{row.total}</TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {row.average.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} /{' '}
                    {row.periodLabel}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
