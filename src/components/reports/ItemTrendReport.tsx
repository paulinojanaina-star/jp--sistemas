import { useState, useCallback, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Check, ChevronsUpDown, RefreshCw, BarChart3 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const chartConfig = {
  quantity: {
    label: 'Saídas',
    color: 'hsl(var(--primary))',
  },
}

export function ItemTrendReport() {
  const { items } = useInventoryStore()
  const { toast } = useToast()

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const to = new Date()
    const from = new Date()
    from.setMonth(to.getMonth() - 5) // Default to last 6 months
    return { from, to }
  })

  const [selectedItemId, setSelectedItemId] = useState<string>('')
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<{ month: string; quantity: number }[]>([])
  const [loading, setLoading] = useState(false)

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedItemId),
    [items, selectedItemId],
  )

  useEffect(() => {
    if (items.length > 0 && !selectedItemId) {
      setSelectedItemId(items[0].id)
    }
  }, [items, selectedItemId])

  const fetchData = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to || !selectedItemId) return
    setLoading(true)

    try {
      const start = new Date(dateRange.from)
      start.setHours(0, 0, 0, 0)
      const end = new Date(dateRange.to)
      end.setHours(23, 59, 59, 999)

      const { data: moves, error } = await supabase
        .from('inventory_movements')
        .select('quantity, created_at')
        .eq('type', 'OUT')
        .eq('item_id', selectedItemId)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())

      if (error) throw new Error('Falha ao buscar dados')

      const chartDataMap = new Map<string, { month: string; quantity: number; sortKey: number }>()

      let current = new Date(start)
      current.setDate(1)
      current.setHours(0, 0, 0, 0)
      const endMonth = new Date(end)
      endMonth.setDate(1)
      endMonth.setHours(0, 0, 0, 0)

      while (current <= endMonth) {
        const key = `${months[current.getMonth()]}/${current.getFullYear().toString().slice(2)}`
        chartDataMap.set(key, { month: key, quantity: 0, sortKey: current.getTime() })
        current.setMonth(current.getMonth() + 1)
      }

      moves?.forEach((m) => {
        const date = new Date(m.created_at!)
        const key = `${months[date.getMonth()]}/${date.getFullYear().toString().slice(2)}`

        if (chartDataMap.has(key)) {
          const entry = chartDataMap.get(key)!
          entry.quantity += Number(m.quantity)
        } else {
          chartDataMap.set(key, {
            month: key,
            quantity: Number(m.quantity),
            sortKey: date.getTime(),
          })
        }
      })

      const chartData = Array.from(chartDataMap.values()).sort((a, b) => a.sortKey - b.sortKey)
      setData(chartData)
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as tendências.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [dateRange, selectedItemId, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalQuantity = useMemo(() => data.reduce((acc, curr) => acc + curr.quantity, 0), [data])
  const isEmpty = data.length === 0 || totalQuantity === 0

  return (
    <Card>
      <CardHeader className="flex flex-col xl:flex-row items-start xl:items-center justify-between pb-4 gap-4">
        <div className="space-y-1">
          <CardTitle className="text-lg">Tendência de Consumo</CardTitle>
          <CardDescription>
            Visualize o histórico de saídas de um material específico.
          </CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full sm:w-[250px] justify-between"
              >
                <span className="truncate">
                  {selectedItem ? selectedItem.name : 'Selecione um item...'}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full sm:w-[250px] p-0">
              <Command>
                <CommandInput placeholder="Buscar item..." />
                <CommandList>
                  <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                  <CommandGroup>
                    {items.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.name}
                        onSelect={() => {
                          setSelectedItemId(item.id)
                          setOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedItemId === item.id ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        {item.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <DatePickerWithRange
            date={dateRange}
            setDate={setDateRange}
            className="w-full sm:w-auto"
          />

          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={loading}
            title="Atualizar dados"
            className="hidden sm:inline-flex"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[350px] w-full">
            <Skeleton className="h-full w-full" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-[350px] text-center text-muted-foreground gap-3 border rounded-lg border-dashed">
            <BarChart3 className="h-10 w-10 opacity-20" />
            <p>Nenhuma movimentação de saída encontrada para este item no período selecionado.</p>
          </div>
        ) : (
          <div className="h-[350px] w-full">
            <ChartContainer config={chartConfig} className="h-full w-full min-h-[300px]">
              <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  className="stroke-border/50"
                />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
                <ChartTooltip
                  cursor={{ fill: 'var(--theme-primary)', opacity: 0.1 }}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="quantity"
                  fill="var(--color-quantity)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
