import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  HelpCircle,
  TrendingDown,
  CalendarClock,
  Loader2,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  usePurchasePrediction,
  type RiskLevel,
  type PredictionItem,
} from '@/hooks/use-purchase-prediction'
import { exportGenericPdf } from '@/utils/exportPdf'
import { useToast } from '@/hooks/use-toast'

const RISK_CONFIG: Record<
  RiskLevel,
  { label: string; color: string; bgColor: string; borderColor: string; icon: typeof AlertTriangle }
> = {
  critical: {
    label: 'Crítico',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: AlertTriangle,
  },
  warning: {
    label: 'Atenção',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    icon: Clock,
  },
  stable: {
    label: 'Estável',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: CheckCircle2,
  },
  'no-data': {
    label: 'Sem dados',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/30',
    borderColor: 'border-border',
    icon: HelpCircle,
  },
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const config = RISK_CONFIG[level]
  const Icon = config.icon
  return (
    <Badge
      variant="outline"
      className={cn('gap-1.5 font-semibold', config.color, config.borderColor)}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof AlertTriangle
  label: string
  value: string | number
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <Icon className={cn('h-4 w-4', color)} />
        </div>
        <p className="text-2xl font-bold mt-2">{value}</p>
      </CardContent>
    </Card>
  )
}

export function PurchasePredictionReport() {
  const [period, setPeriod] = useState(30)
  const [healthUnit, setHealthUnit] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const { loading, items, healthUnits } = usePurchasePrediction(period, healthUnit)

  const filteredItems = useMemo(() => {
    if (!search) return items
    return items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
  }, [items, search])

  const stats = useMemo(() => {
    let critical = 0
    let warning = 0
    let stable = 0
    let noData = 0
    items.forEach((i) => {
      switch (i.riskLevel) {
        case 'critical':
          critical++
          break
        case 'warning':
          warning++
          break
        case 'stable':
          stable++
          break
        case 'no-data':
          noData++
          break
      }
    })
    return { critical, warning, stable, noData }
  }, [items])

  const handleExport = async () => {
    setIsExporting(true)
    const columns = [
      { header: 'Item', key: 'name', width: 30 },
      { header: 'Estoque Atual', key: 'current_quantity', width: 15 },
      { header: 'Estoque Mínimo', key: 'min_quantity', width: 15 },
      { header: 'Consumo Diário', key: 'adc', width: 15 },
      { header: 'Dias p/ Crítico', key: 'daysUntilCritical', width: 15 },
      { header: 'Data Prevista Crítico', key: 'predictedCriticalDate', width: 22 },
      { header: 'Sugestão de Compra', key: 'suggestedRestockDate', width: 22 },
      { header: 'Risco', key: 'riskLevel', width: 12 },
    ]
    const { error } = await exportGenericPdf(
      'Predição de Compra - Análise de Risco de Estoque',
      filteredItems,
      columns,
    )
    setIsExporting(false)
    if (error) {
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível gerar o arquivo.',
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Exportação concluída!' })
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    try {
      return format(new Date(dateStr + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })
    } catch {
      return '—'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Dashboard de Predição de Compra
          </CardTitle>
          <CardDescription>
            Previsão de esgotamento de estoque baseada no consumo histórico. Identifique itens
            críticos antes que faltem.
          </CardDescription>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Select value={period.toString()} onValueChange={(v) => setPeriod(Number(v))}>
              <SelectTrigger className="h-9 w-[200px]">
                <SelectValue placeholder="Período de análise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="15">Últimos 15 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={healthUnit ?? 'all'}
              onValueChange={(v) => setHealthUnit(v === 'all' ? null : v)}
            >
              <SelectTrigger className="h-9 w-[220px]">
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
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              disabled={isExporting || filteredItems.length === 0}
              onClick={handleExport}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Exportar
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard
          icon={AlertTriangle}
          label="Crítico (≤7 dias)"
          value={stats.critical}
          color="text-red-500"
        />
        <StatCard
          icon={Clock}
          label="Atenção (8-15 dias)"
          value={stats.warning}
          color="text-yellow-500"
        />
        <StatCard
          icon={CheckCircle2}
          label="Estável (>15 dias)"
          value={stats.stable}
          color="text-green-500"
        />
        <StatCard
          icon={HelpCircle}
          label="Sem Dados"
          value={stats.noData}
          color="text-muted-foreground"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar item..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Estoque Atual</TableHead>
                  <TableHead className="text-right">Estoque Mín.</TableHead>
                  <TableHead className="text-right">Consumo Diário</TableHead>
                  <TableHead className="text-center">Risco</TableHead>
                  <TableHead className="text-right">Dias p/ Crítico</TableHead>
                  <TableHead className="text-right">Data Crítico</TableHead>
                  <TableHead className="text-right">Sugestão de Compra</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      {search ? 'Nenhum item encontrado para a busca.' : 'Nenhum item cadastrado.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item: PredictionItem) => {
                    const config = RISK_CONFIG[item.riskLevel]
                    return (
                      <TableRow key={item.id} className={cn('border-l-4', config.borderColor)}>
                        <TableCell className="font-medium">
                          {item.name}
                          {item.unit_type && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {item.unit_type}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.current_quantity.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {item.min_quantity.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {item.adc > 0 ? item.adc.toFixed(2) : '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <RiskBadge level={item.riskLevel} />
                        </TableCell>
                        <TableCell className="text-right">
                          {item.riskLevel === 'no-data' ? (
                            <span className="text-muted-foreground text-xs italic">
                              {item.movementCount === 0 ? 'Dados insuficientes' : 'Sem consumo'}
                            </span>
                          ) : item.daysUntilCritical === 0 ? (
                            <span className="text-red-600 dark:text-red-400 font-bold">Agora</span>
                          ) : (
                            <span className={config.color}>{item.daysUntilCritical} dias</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.riskLevel === 'no-data' ? (
                            '—'
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    className={cn('inline-flex items-center gap-1', config.color)}
                                  >
                                    <CalendarClock className="h-3.5 w-3.5" />
                                    {formatDate(item.predictedCriticalDate)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Estimativa de zeragem: {formatDate(item.predictedZeroDate)}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.riskLevel === 'no-data' ? (
                            '—'
                          ) : (
                            <span className="text-primary font-medium">
                              {formatDate(item.suggestedRestockDate)}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
