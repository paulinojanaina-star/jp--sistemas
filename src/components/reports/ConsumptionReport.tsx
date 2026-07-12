import { useState } from 'react'
import { subDays, startOfMonth, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { CalendarIcon, TrendingUp, TrendingDown, Package, Activity, Zap, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConsumptionReport } from '@/hooks/use-consumption-report'
import { ConsumptionCharts } from './ConsumptionCharts'

type DatePreset = '7d' | '30d' | 'thisMonth' | 'custom'

function getPresetRange(preset: DatePreset) {
  const now = new Date()
  switch (preset) {
    case '7d':
      return { start: subDays(now, 7), end: now }
    case '30d':
      return { start: subDays(now, 30), end: now }
    case 'thisMonth':
      return { start: startOfMonth(now), end: now }
    default:
      return { start: subDays(now, 30), end: now }
  }
}

export function ConsumptionReport() {
  const [preset, setPreset] = useState<DatePreset>('30d')
  const [dateRange, setDateRange] = useState(() => getPresetRange('30d'))
  const [healthUnit, setHealthUnit] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [itemSearchOpen, setItemSearchOpen] = useState(false)

  const { loading, metrics, barData, lineData, items, healthUnits } = useConsumptionReport(
    dateRange,
    healthUnit,
    selectedItemId,
  )

  const handlePreset = (p: DatePreset) => {
    setPreset(p)
    if (p !== 'custom') setDateRange(getPresetRange(p))
  }

  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      setPreset('custom')
      setDateRange({ start: range.from, end: range.to })
    }
  }

  const selectedItemName = items.find((i) => i.id === selectedItemId)?.name

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Relatório de Consumo Dinâmico</CardTitle>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {(['7d', '30d', 'thisMonth'] as DatePreset[]).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={preset === p ? 'default' : 'outline'}
                onClick={() => handlePreset(p)}
                className="h-8"
              >
                {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : 'Este mês'}
              </Button>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.start, 'dd/MM/yyyy', { locale: ptBR })} -{' '}
                  {format(dateRange.end, 'dd/MM/yyyy', { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.start, to: dateRange.end }}
                  onSelect={handleDateSelect}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            <Select
              value={healthUnit ?? 'all'}
              onValueChange={(v) => setHealthUnit(v === 'all' ? null : v)}
            >
              <SelectTrigger className="h-8 w-[200px]">
                <SelectValue placeholder="Unidade de Saúde" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Unidades</SelectItem>
                {healthUnits.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Consumido</p>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-2">
              {metrics?.totalConsumed.toLocaleString('pt-BR') ?? '—'}
            </p>
            {metrics && metrics.previousTotal > 0 && (
              <div className="flex items-center gap-1 mt-1">
                {metrics.variationPercentage > 0 ? (
                  <TrendingUp className="h-3 w-3 text-red-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-green-500" />
                )}
                <span
                  className={cn(
                    'text-xs font-medium',
                    metrics.variationPercentage > 0 ? 'text-red-500' : 'text-green-500',
                  )}
                >
                  {metrics.variationPercentage > 0 ? '▲' : '▼'}{' '}
                  {Math.abs(metrics.variationPercentage).toFixed(1)}% vs período anterior
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Média Diária</p>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-2">
              {metrics ? metrics.dailyAverage.toFixed(1) : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">itens consumidos por dia</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Maior Variação</p>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-2 truncate">
              {metrics?.topVariationItem?.name ?? '—'}
            </p>
            {metrics?.topVariationItem && (
              <div className="flex items-center gap-1 mt-1">
                {metrics.topVariationItem.variation > 0 ? (
                  <TrendingUp className="h-3 w-3 text-red-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-green-500" />
                )}
                <span
                  className={cn(
                    'text-xs font-medium',
                    metrics.topVariationItem.variation > 0 ? 'text-red-500' : 'text-green-500',
                  )}
                >
                  {metrics.topVariationItem.variation > 0 ? '▲' : '▼'}{' '}
                  {Math.abs(metrics.topVariationItem.variation).toFixed(1)}% de variação
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Item:
            </span>
            <Popover open={itemSearchOpen} onOpenChange={setItemSearchOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  {selectedItemName ?? 'Selecionar item...'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start">
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
                            setSelectedItemId(item.id === selectedItemId ? null : item.id)
                            setItemSearchOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              item.id === selectedItemId ? 'opacity-100' : 'opacity-0',
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
          </div>
        </CardContent>
      </Card>

      <ConsumptionCharts
        barData={barData}
        lineData={lineData}
        loading={loading}
        selectedItemId={selectedItemId}
      />
    </div>
  )
}
