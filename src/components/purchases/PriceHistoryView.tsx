import { useState, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  Search,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  HelpCircle,
  FileText,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ExportButtons } from '@/components/ExportButtons'
import { GenericExportOptions } from '@/utils/exportGeneric'
import {
  ItemPriceHistoryEntry,
  ItemPriceMetrics,
  ItemPriceSpikeRanking,
} from '@/types/priceHistory'
import {
  calculateItemPriceMetrics,
  calculateSpikeRanking,
  PRICE_INCREASE_ALERT_THRESHOLD,
} from '@/services/priceHistory'
import { formatItemDisplay } from '@/utils/itemFormat'

interface PriceHistoryViewProps {
  history: ItemPriceHistoryEntry[]
  items: any[]
  loading?: boolean
  initialSelectedItemId?: string
  onSelectItem?: (itemId: string) => void
}

// Fixed distinct color palette for suppliers in the chart
const SUPPLIER_COLORS = [
  '#2563eb', // blue
  '#16a34a', // green
  '#d97706', // amber
  '#dc2626', // red
  '#9333ea', // purple
  '#0891b2', // cyan
  '#ea580c', // orange
  '#4f46e5', // indigo
  '#db2777', // pink
  '#059669', // emerald
]

export function PriceHistoryView({
  history,
  items,
  loading = false,
  initialSelectedItemId,
}: PriceHistoryViewProps) {
  const [searchItem, setSearchItem] = useState('')
  const [selectedItemId, setSelectedItemId] = useState<string>(
    initialSelectedItemId || (items.length > 0 ? items[0].id : ''),
  )
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL')

  // Update selected item if initialSelectedItemId changes
  useMemo(() => {
    if (initialSelectedItemId && initialSelectedItemId !== selectedItemId) {
      setSelectedItemId(initialSelectedItemId)
    }
  }, [initialSelectedItemId])

  // Items map for fast lookup
  const itemsMap = useMemo(() => {
    const map = new Map<string, any>()
    items.forEach((it) => map.set(it.id, it))
    return map
  }, [items])

  // Filtered item list for selector
  const filteredItemList = useMemo(() => {
    if (!searchItem.trim()) return items
    const q = searchItem.toLowerCase().trim()
    return items.filter(
      (it) => it.name.toLowerCase().includes(q) || it.supplier?.toLowerCase().includes(q),
    )
  }, [items, searchItem])

  // Selected item object
  const currentItem = useMemo(() => {
    return itemsMap.get(selectedItemId) || items[0] || null
  }, [itemsMap, selectedItemId, items])

  // History entries for selected item
  const itemHistory = useMemo(() => {
    if (!selectedItemId) return []
    return history
      .filter((h) => h.item_id === selectedItemId)
      .sort((a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime())
  }, [history, selectedItemId])

  // Suppliers present for this item
  const itemSuppliers = useMemo(() => {
    const set = new Set<string>()
    itemHistory.forEach((h) => {
      if (h.supplier) set.add(h.supplier)
    })
    return Array.from(set).sort()
  }, [itemHistory])

  // Color map for each supplier
  const supplierColorMap = useMemo(() => {
    const map = new Map<string, string>()
    itemSuppliers.forEach((s, idx) => {
      map.set(s, SUPPLIER_COLORS[idx % SUPPLIER_COLORS.length])
    })
    return map
  }, [itemSuppliers])

  // Calculate metrics for current item
  const metrics: ItemPriceMetrics = useMemo(() => {
    return calculateItemPriceMetrics(itemHistory, Number(currentItem?.unit_price || 0))
  }, [itemHistory, currentItem])

  // Filtered table history based on supplier filter
  const filteredItemHistory = useMemo(() => {
    if (supplierFilter === 'ALL') return itemHistory
    return itemHistory.filter((h) => h.supplier === supplierFilter)
  }, [itemHistory, supplierFilter])

  // Data for Recharts LineChart
  // Group points by date, with values per supplier
  const chartData = useMemo(() => {
    if (itemHistory.length === 0) return []

    // Map by record_date string
    const dateMap = new Map<string, any>()

    itemHistory.forEach((h) => {
      const dateKey = h.record_date
      if (!dateMap.has(dateKey)) {
        const parts = dateKey.split('-')
        const formattedDate =
          parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0].slice(2)}` : dateKey
        dateMap.set(dateKey, {
          rawDate: dateKey,
          date: formattedDate,
          fullDate: dateKey,
          overallPrice: h.unit_price,
          quantity: h.quantity,
          request_number: h.request_number,
        })
      }

      const point = dateMap.get(dateKey)
      const supplierKey = h.supplier || 'Não informado'
      point[supplierKey] = h.unit_price
      point[`${supplierKey}__qty`] = h.quantity
      point[`${supplierKey}__po`] = h.request_number
    })

    return Array.from(dateMap.values()).sort(
      (a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime(),
    )
  }, [itemHistory])

  // Calculate spike ranking across ALL items
  const spikeRanking: ItemPriceSpikeRanking[] = useMemo(() => {
    return calculateSpikeRanking(history, itemsMap, 180, 5)
  }, [history, itemsMap])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0)
  }

  return (
    <div className="space-y-6">
      {/* Top Selector Card & Summary */}
      <Card className="rounded-2xl border-border/60 shadow-md bg-card/90 backdrop-blur">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-primary" />
                Selecione o Insumo / Medicamento
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Select
                    value={selectedItemId}
                    onValueChange={(val) => {
                      setSelectedItemId(val)
                      setSupplierFilter('ALL')
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-xl text-sm font-semibold truncate bg-background">
                      <SelectValue placeholder="Selecione um item..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Filtrar opções..."
                          value={searchItem}
                          onChange={(e) => setSearchItem(e.target.value)}
                          className="h-8 text-xs"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                      {filteredItemList.length === 0 ? (
                        <div className="p-3 text-xs text-muted-foreground text-center">
                          Nenhum insumo encontrado.
                        </div>
                      ) : (
                        filteredItemList.map((it) => (
                          <SelectItem key={it.id} value={it.id} className="text-xs font-medium">
                            <span className="font-bold">{it.name}</span>
                            {it.unit_type ? ` (${it.unit_type})` : ''} - Atual:{' '}
                            {formatCurrency(Number(it.unit_price || 0))}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {itemSuppliers.length > 1 && (
                  <div className="w-full sm:w-56">
                    <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                      <SelectTrigger className="h-11 rounded-xl text-xs font-medium bg-background">
                        <div className="flex items-center gap-1.5 truncate">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <SelectValue placeholder="Fornecedor" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">
                          Todos os Fornecedores ({itemSuppliers.length})
                        </SelectItem>
                        {itemSuppliers.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Item Current Header Badge */}
            {currentItem && (
              <div className="lg:border-l lg:pl-6 flex flex-col justify-center space-y-1">
                <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                  Preço Vigente no Catálogo
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-foreground">
                    {formatCurrency(Number(currentItem.unit_price || 0))}
                  </span>
                  <Badge variant="outline" className="font-bold text-xs uppercase">
                    {currentItem.unit_type || 'UN'}
                  </Badge>
                </div>
                <div className="text-[11px] text-muted-foreground truncate max-w-xs">
                  Fornecedor principal: {currentItem.supplier || 'Não cadastrado'}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Item Key Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Metric 1: Último Preço Pago */}
        <Card className="rounded-2xl border-border/60 shadow-sm bg-card p-4 flex flex-col justify-between">
          <div className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            Última Compra
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-foreground tracking-tight">
              {formatCurrency(metrics.lastPrice)}
            </div>
            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
              {metrics.lastPurchaseDate
                ? new Date(metrics.lastPurchaseDate + 'T00:00:00').toLocaleDateString('pt-BR')
                : 'Sem registro'}
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground truncate">
            {metrics.lastSupplier || 'Fornecedor N/A'}
          </div>
        </Card>

        {/* Metric 2: Menor Preço Já Pago */}
        <Card className="rounded-2xl border-border/60 shadow-sm bg-card p-4 flex flex-col justify-between">
          <div className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Menor Preço Histórico
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatCurrency(metrics.minPrice)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Melhor cotação registrada
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground">Base para negociações</div>
        </Card>

        {/* Metric 3: Maior Preço Já Pago */}
        <Card className="rounded-2xl border-border/60 shadow-sm bg-card p-4 flex flex-col justify-between">
          <div className="text-[11px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Maior Preço Histórico
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              {formatCurrency(metrics.maxPrice)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Pico de preço no período</div>
          </div>
          <div className="text-[10px] text-muted-foreground">Teto já contratado</div>
        </Card>

        {/* Metric 4: Preço Médio Ponderado */}
        <Card className="rounded-2xl border-border/60 shadow-sm bg-card p-4 flex flex-col justify-between">
          <div className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            Preço Médio Ponderado
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-foreground tracking-tight">
              {formatCurrency(metrics.avgPrice)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Média por volume comprado
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground">
            {metrics.totalPurchasesCount}{' '}
            {metrics.totalPurchasesCount === 1 ? 'registro' : 'registros'}
          </div>
        </Card>

        {/* Metric 5: Variação da Última Compra */}
        <Card
          className={`rounded-2xl border-border/60 shadow-sm p-4 col-span-2 sm:col-span-2 lg:col-span-1 flex flex-col justify-between ${
            metrics.isIncreaseAlert
              ? 'bg-rose-500/10 border-rose-500/30'
              : metrics.changeVsPreviousPercent !== null && metrics.changeVsPreviousPercent < 0
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              Variação vs. Anterior
            </span>
            {metrics.isIncreaseAlert && (
              <Badge variant="destructive" className="font-bold text-[10px] px-1.5 py-0">
                Alerta &gt; {PRICE_INCREASE_ALERT_THRESHOLD}%
              </Badge>
            )}
          </div>
          <div className="my-2">
            {metrics.changeVsPreviousPercent !== null ? (
              <div className="flex items-center gap-1.5">
                {metrics.changeVsPreviousPercent > 0 ? (
                  <TrendingUp className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                ) : metrics.changeVsPreviousPercent < 0 ? (
                  <TrendingDown className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <Minus className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <span
                  className={`text-2xl font-black tracking-tight ${
                    metrics.changeVsPreviousPercent > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : metrics.changeVsPreviousPercent < 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-muted-foreground'
                  }`}
                >
                  {metrics.changeVsPreviousPercent > 0 ? '+' : ''}
                  {metrics.changeVsPreviousPercent}%
                </span>
              </div>
            ) : (
              <span className="text-xl font-bold text-muted-foreground">-</span>
            )}
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {metrics.changeVsAvgPercent !== null ? (
                <span>
                  vs. Média:{' '}
                  <b
                    className={
                      metrics.changeVsAvgPercent > 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }
                  >
                    {metrics.changeVsAvgPercent > 0 ? '+' : ''}
                    {metrics.changeVsAvgPercent}%
                  </b>
                </span>
              ) : (
                'Primeira compra deste item'
              )}
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground truncate">
            {metrics.previousPrice
              ? `Penúltimo: ${formatCurrency(metrics.previousPrice)}`
              : 'Sem compra anterior'}
          </div>
        </Card>
      </div>

      {/* Alerta de Aumento em Destaque */}
      {metrics.isIncreaseAlert && (
        <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-transparent p-4 flex items-start gap-3 text-rose-900 dark:text-rose-200">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1 text-xs">
            <div className="font-black text-sm flex items-center gap-2">
              <span>Aumento Expressivo de Preço Detectado</span>
              <Badge variant="destructive" className="font-extrabold text-[10px]">
                ↑ +{metrics.changeVsPreviousPercent}%
              </Badge>
            </div>
            <p className="mt-1 text-rose-800 dark:text-rose-300 font-medium">
              O valor unitário pago na última compra ({formatCurrency(metrics.lastPrice)}) está{' '}
              {metrics.changeVsPreviousPercent !== null && metrics.changeVsPreviousPercent > 0
                ? `${metrics.changeVsPreviousPercent}% acima da compra anterior`
                : `${metrics.changeVsAvgPercent}% acima da média histórica`}
              . Recomendamos abrir cotação com outros fornecedores ou renegociar com{' '}
              <b>{metrics.lastSupplier || 'o fornecedor'}</b>.
            </p>
          </div>
        </div>
      )}

      {/* Main Chart Section: Price Curve per Supplier */}
      <Card className="rounded-2xl border-border/60 shadow-lg overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b bg-muted/20 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-black tracking-tight text-foreground">
                Curva de Preço por Fornecedor ao Longo do Tempo
              </CardTitle>
              {itemSuppliers.length > 1 && (
                <Badge variant="secondary" className="font-bold text-xs bg-primary/10 text-primary">
                  {itemSuppliers.length} fornecedores comparados
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs mt-0.5">
              Evolução do valor unitário pago em cada compra registrada (eixo X cronológico, valores
              em R$)
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <ExportButtons
              disabled={filteredItemHistory.length === 0}
              options={(): GenericExportOptions<any> => ({
                filename: `historico-precos-${currentItem?.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'item'}`,
                title: `Histórico de Preços: ${currentItem?.name || 'Item'}`,
                subtitle: `Último Preço: ${formatCurrency(metrics.lastPrice)} | Média: ${formatCurrency(metrics.avgPrice)} | Menor: ${formatCurrency(metrics.minPrice)}`,
                filters: [
                  { label: 'Item', value: currentItem?.name || '-' },
                  { label: 'Fornecedor', value: supplierFilter },
                  { label: 'Total Registros', value: String(filteredItemHistory.length) },
                ],
                data: filteredItemHistory,
                columns: [
                  {
                    header: 'Data',
                    accessor: (h) =>
                      h.record_date
                        ? new Date(h.record_date + 'T00:00:00').toLocaleDateString('pt-BR')
                        : '-',
                  },
                  { header: 'Nº Solicitação', accessor: (h) => h.request_number || '-' },
                  { header: 'Fornecedor', accessor: (h) => h.supplier || '-' },
                  { header: 'Unidade', accessor: (h) => h.health_unit_name || '-' },
                  {
                    header: 'Qtd. Comprada',
                    accessor: (h) => `${h.quantity} ${currentItem?.unit_type || 'un'}`,
                    align: 'right',
                  },
                  {
                    header: 'Preço Unitário (R$)',
                    accessor: (h) => formatCurrency(h.unit_price),
                    align: 'right',
                  },
                  {
                    header: 'Subtotal (R$)',
                    accessor: (h) => formatCurrency(h.total_price),
                    align: 'right',
                  },
                  { header: 'Origem', accessor: (h) => h.source_type },
                ],
              })}
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="h-[340px] flex items-center justify-center text-muted-foreground text-sm font-medium">
              Carregando histórico...
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground text-center p-6 border border-dashed rounded-xl">
              <Building2 className="h-8 w-8 opacity-40 mb-2" />
              <p className="font-bold text-sm text-foreground">
                Nenhum ponto de preço registrado para este item
              </p>
              <p className="text-xs max-w-sm mt-1">
                Ao cadastrar ou receber pedidos de compra informando o valor unitário, a curva de
                preços será gerada automaticamente.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} dy={10} />
                    <YAxis
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => `R$ ${v.toFixed(2)}`}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      content={({ active, payload, label }: any) => {
                        if (!active || !payload || !payload.length) return null
                        const point = payload[0]?.payload
                        return (
                          <div className="rounded-xl border bg-background/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-2 min-w-[200px]">
                            <div className="font-bold border-b pb-1 flex items-center justify-between text-foreground">
                              <span>Data: {label}</span>
                              {point?.request_number && (
                                <span className="font-mono text-muted-foreground text-[10px]">
                                  #{point.request_number}
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              {payload.map((entry: any) => {
                                if (entry.value === undefined || entry.value === null) return null
                                return (
                                  <div
                                    key={entry.dataKey}
                                    className="flex items-center justify-between gap-3"
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <div
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: entry.color }}
                                      />
                                      <span className="font-medium text-foreground truncate">
                                        {entry.name}:
                                      </span>
                                    </div>
                                    <span className="font-mono font-black text-foreground">
                                      {formatCurrency(entry.value)}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                            {point?.quantity && (
                              <div className="text-[10px] text-muted-foreground border-t pt-1 flex justify-between">
                                <span>Volume comprado:</span>
                                <span className="font-bold">
                                  {point.quantity} {currentItem?.unit_type || 'un'}
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(value) => (
                        <span className="text-xs font-bold text-foreground mr-3">{value}</span>
                      )}
                    />

                    {/* One line per supplier */}
                    {itemSuppliers.map((supplier) => {
                      const color = supplierColorMap.get(supplier) || '#2563eb'
                      return (
                        <Line
                          key={supplier}
                          type="monotone"
                          dataKey={supplier}
                          name={supplier}
                          stroke={color}
                          strokeWidth={3}
                          dot={{ r: 5, fill: color, strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 7, strokeWidth: 2 }}
                          connectNulls
                        />
                      )
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Chart Legend helper */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-muted-foreground border-t">
                <span>
                  💡 Dica: pontos mais altos indicam compras com valor unitário superior. Aproxime o
                  mouse do ponto para ver nº da solicitação e volume.
                </span>
                <span>
                  Total de compras registradas: <b>{itemHistory.length}</b>
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historical Purchases Table */}
      <Card className="rounded-2xl border-border/60 shadow-md overflow-hidden">
        <CardHeader className="bg-muted/30 border-b py-3 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground">
              Tabela Cronológica de Compras do Item ({filteredItemHistory.length})
            </CardTitle>
            <span className="text-xs text-muted-foreground font-medium">
              Ordenada da mais recente para a mais antiga
            </span>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="font-extrabold text-xs uppercase tracking-wider py-3 pl-6">
                  Data da Compra
                </TableHead>
                <TableHead className="font-extrabold text-xs uppercase tracking-wider py-3">
                  Nº Solicitação
                </TableHead>
                <TableHead className="font-extrabold text-xs uppercase tracking-wider py-3">
                  Fornecedor
                </TableHead>
                <TableHead className="font-extrabold text-xs uppercase tracking-wider py-3">
                  Unidade Destino
                </TableHead>
                <TableHead className="font-extrabold text-xs uppercase tracking-wider py-3 text-right">
                  Qtd. Comprada
                </TableHead>
                <TableHead className="font-extrabold text-xs uppercase tracking-wider py-3 text-right">
                  Valor Unitário
                </TableHead>
                <TableHead className="font-extrabold text-xs uppercase tracking-wider py-3 text-right">
                  Subtotal
                </TableHead>
                <TableHead className="font-extrabold text-xs uppercase tracking-wider py-3 pr-6 text-center">
                  Variação
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItemHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">
                    Nenhum registro para os filtros selecionados.
                  </TableCell>
                </TableRow>
              ) : (
                [...filteredItemHistory].reverse().map((entry, idx, arr) => {
                  const formattedDate = entry.record_date
                    ? new Date(entry.record_date + 'T00:00:00').toLocaleDateString('pt-BR')
                    : '-'

                  // Compare with older entry (which is next in reversed array)
                  const olderEntry = arr[idx + 1]
                  let changePct: number | null = null
                  if (olderEntry && olderEntry.unit_price > 0) {
                    changePct = Number(
                      (
                        ((entry.unit_price - olderEntry.unit_price) / olderEntry.unit_price) *
                        100
                      ).toFixed(1),
                    )
                  }

                  const isLowest = entry.unit_price === metrics.minPrice && metrics.minPrice > 0
                  const isHighest =
                    entry.unit_price === metrics.maxPrice && metrics.maxPrice > metrics.minPrice

                  return (
                    <TableRow key={entry.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="pl-6 py-3 font-medium text-xs text-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{formattedDate}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 font-mono font-bold text-xs">
                        {entry.request_number ? (
                          <span className="text-foreground">#{entry.request_number}</span>
                        ) : (
                          <span className="text-muted-foreground italic font-sans font-normal text-[11px]">
                            {entry.source_type === 'INITIAL_CATALOG'
                              ? 'Catálogo Inicial'
                              : 'Ajuste'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 font-semibold text-xs text-foreground">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                supplierColorMap.get(entry.supplier || '') || '#94a3b8',
                            }}
                          />
                          <span>{entry.supplier || 'Não informado'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground">
                        {entry.health_unit_name || 'Almoxarifado Central'}
                      </TableCell>
                      <TableCell className="py-3 text-right font-mono font-bold text-xs">
                        {entry.quantity}{' '}
                        <span className="text-[10px] text-muted-foreground font-normal">
                          {currentItem?.unit_type || 'un'}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-right font-mono font-black text-xs">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-foreground">
                            {formatCurrency(entry.unit_price)}
                          </span>
                          {isLowest && (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[9px] px-1 py-0"
                              title="Menor preço já pago"
                            >
                              Menor
                            </Badge>
                          )}
                          {isHighest && (
                            <Badge
                              variant="outline"
                              className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-[9px] px-1 py-0"
                              title="Maior preço pago"
                            >
                              Maior
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-right font-mono text-xs text-muted-foreground">
                        {formatCurrency(entry.total_price)}
                      </TableCell>
                      <TableCell className="py-3 pr-6 text-center">
                        {changePct !== null ? (
                          <span
                            className={`inline-flex items-center gap-0.5 text-xs font-black font-mono px-1.5 py-0.5 rounded-md ${
                              changePct > 0
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                : changePct < 0
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'text-muted-foreground'
                            }`}
                          >
                            {changePct > 0 ? '▲ +' : changePct < 0 ? '▼ ' : ''}
                            {changePct}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs font-mono">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Ranking de Maiores Aumentos (Visão Geral para Negociação) */}
      <Card className="rounded-2xl border-border/60 shadow-lg overflow-hidden bg-card/95">
        <CardHeader className="border-b bg-gradient-to-r from-rose-500/5 via-amber-500/5 to-transparent p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-black tracking-tight text-foreground">
                    Ranking de Itens com Maior Aumento Recente
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Visão estratégica para negociação: itens com maior salto percentual de preço
                    entre compras
                  </CardDescription>
                </div>
              </div>
            </div>

            <ExportButtons
              disabled={spikeRanking.length === 0}
              options={(): GenericExportOptions<any> => ({
                filename: 'ranking-aumento-precos-negociacao',
                title: 'Ranking de Itens com Maior Aumento de Preço',
                subtitle:
                  'Itens que sofreram reajustes recentes para renegociação com fornecedores',
                data: spikeRanking,
                columns: [
                  { header: 'Item', key: 'item_name' },
                  { header: 'Fornecedor Recente', key: 'supplier' },
                  {
                    header: 'Estoque Atual',
                    accessor: (r) => `${r.current_quantity} ${r.unit_type || 'un'}`,
                  },
                  {
                    header: 'Preço Anterior (R$)',
                    accessor: (r) => formatCurrency(r.previousOrAvgPrice),
                    align: 'right',
                  },
                  {
                    header: 'Preço Recente (R$)',
                    accessor: (r) => formatCurrency(r.latestPrice),
                    align: 'right',
                  },
                  {
                    header: 'Aumento (%)',
                    accessor: (r) => `+${r.increasePercent}%`,
                    align: 'right',
                  },
                  {
                    header: 'Data Recente',
                    accessor: (r) =>
                      r.latestDate
                        ? new Date(r.latestDate + 'T00:00:00').toLocaleDateString('pt-BR')
                        : '-',
                  },
                ],
              })}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {spikeRanking.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              <Sparkles className="h-8 w-8 mx-auto opacity-30 mb-2 text-emerald-500" />
              <p className="font-bold text-sm text-foreground">
                Nenhum aumento expressivo registrado
              </p>
              <p className="max-w-sm mx-auto mt-1">
                Todos os itens adquiridos mantiveram estabilidade de preços nas compras recentes.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-extrabold text-xs uppercase tracking-wider py-3 pl-6 w-12 text-center">
                      #
                    </TableHead>
                    <TableHead className="font-extrabold text-xs uppercase tracking-wider py-3">
                      Insumo / Medicamento
                    </TableHead>
                    <TableHead className="font-extrabold text-xs uppercase tracking-wider py-3">
                      Fornecedor da Última Compra
                    </TableHead>
                    <TableHead className="font-extrabold text-xs uppercase tracking-wider py-3 text-right">
                      Preço Anterior
                    </TableHead>
                    <TableHead className="font-extrabold text-xs uppercase tracking-wider py-3 text-right">
                      Preço Mais Recente
                    </TableHead>
                    <TableHead className="font-extrabold text-xs uppercase tracking-wider py-3 text-center">
                      Variação
                    </TableHead>
                    <TableHead className="font-extrabold text-xs uppercase tracking-wider py-3 pr-6 text-right">
                      Ação
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {spikeRanking.map((spike, rankIdx) => {
                    const isSelected = spike.item_id === selectedItemId
                    const isHighAlert = spike.increasePercent >= PRICE_INCREASE_ALERT_THRESHOLD

                    return (
                      <TableRow
                        key={spike.item_id}
                        className={`hover:bg-muted/40 transition-colors ${
                          isSelected ? 'bg-primary/5 font-semibold' : ''
                        }`}
                      >
                        <TableCell className="pl-6 py-3 text-center font-mono font-bold text-xs text-muted-foreground">
                          {rankIdx + 1}º
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="font-bold text-xs text-foreground truncate max-w-xs">
                            {spike.item_name}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            Estoque atual: {spike.current_quantity} {spike.unit_type || 'un'}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-xs text-foreground font-medium">
                          {spike.supplier || 'Não informado'}
                        </TableCell>
                        <TableCell className="py-3 text-right font-mono text-xs text-muted-foreground">
                          {formatCurrency(spike.previousOrAvgPrice)}
                        </TableCell>
                        <TableCell className="py-3 text-right font-mono font-bold text-xs text-foreground">
                          {formatCurrency(spike.latestPrice)}
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <Badge
                            variant={isHighAlert ? 'destructive' : 'outline'}
                            className={`font-black font-mono text-xs gap-1 ${
                              !isHighAlert
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                                : ''
                            }`}
                          >
                            <TrendingUp className="h-3 w-3" />+{spike.increasePercent}%
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 pr-6 text-right">
                          <Button
                            size="sm"
                            variant={isSelected ? 'default' : 'outline'}
                            onClick={() => {
                              setSelectedItemId(spike.item_id)
                              setSupplierFilter('ALL')
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                            className="h-7 text-xs font-bold gap-1 px-2.5"
                          >
                            <span>Ver Curva</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
