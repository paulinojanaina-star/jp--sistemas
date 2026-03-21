import { useState } from 'react'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { ItemFormModal } from '@/components/ItemFormModal'
import { ItemRowActions } from '@/components/ItemRowActions'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  Search,
  FileText,
  Loader2,
  CalendarIcon,
  AlertTriangle,
  PackageX,
  Clock,
  TrendingDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { exportStockReportPdf } from '@/utils/exportPdf'
import { formatItemDisplay } from '@/utils/itemFormat'
import { getNearestExpiry, parseDateSafe } from '@/utils/expiryLogic'
import { calculateConsumption } from '@/utils/consumptionLogic'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function Items() {
  const { items, movements } = useInventoryStore()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [isGenerating, setIsGenerating] = useState(false)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const filteredItems = items.filter((item) => {
    const formattedName = formatItemDisplay(item).toLowerCase()
    const matchesSearch = formattedName.includes(search.toLowerCase())
    if (!matchesSearch) return false

    if (stockFilter === 'critical')
      return (
        Number(item.current_quantity) > 0 &&
        Number(item.current_quantity) <= Number(item.min_quantity)
      )
    if (stockFilter === 'zero') return Number(item.current_quantity) === 0
    if (stockFilter === 'expiring') {
      if (Number(item.current_quantity) === 0) return false
      const nearest = getNearestExpiry(item, movements)
      if (!nearest) return false
      const diffDays = (nearest.date.getTime() - today.getTime()) / (1000 * 3600 * 24)
      return diffDays <= 60
    }
    if (stockFilter === 'stockout') {
      if (Number(item.current_quantity) === 0) return false
      const { isStockoutRisk } = calculateConsumption(item, movements)
      return isStockoutRisk
    }
    return true
  })

  // Sort logically based on active filter
  if (stockFilter === 'expiring') {
    filteredItems.sort((a, b) => {
      const nearestA = getNearestExpiry(a, movements)
      const nearestB = getNearestExpiry(b, movements)
      if (!nearestA) return 1
      if (!nearestB) return -1
      return nearestA.date.getTime() - nearestB.date.getTime()
    })
  }

  if (stockFilter === 'stockout') {
    filteredItems.sort((a, b) => {
      const riskA = calculateConsumption(a, movements).daysUntilStockout
      const riskB = calculateConsumption(b, movements).daysUntilStockout
      return riskA - riskB
    })
  }

  // Dashboard calculations
  const criticalItemsCount = items.filter(
    (item) =>
      Number(item.current_quantity) > 0 &&
      Number(item.current_quantity) <= Number(item.min_quantity),
  ).length

  const zeroItemsCount = items.filter((item) => Number(item.current_quantity) === 0).length

  const expiringSoonItemsCount = items.filter((item) => {
    if (Number(item.current_quantity) === 0) return false
    const nearest = getNearestExpiry(item, movements)
    if (!nearest) return false
    const diffDays = (nearest.date.getTime() - today.getTime()) / (1000 * 3600 * 24)
    return diffDays >= 0 && diffDays <= 60
  }).length

  const stockoutRiskItemsCount = items.filter((item) => {
    if (Number(item.current_quantity) === 0) return false
    return calculateConsumption(item, movements).isStockoutRisk
  }).length

  const handleExportPDF = async () => {
    setIsGenerating(true)
    const { error } = await exportStockReportPdf(
      stockFilter === 'critical' || stockFilter === 'zero' ? stockFilter : 'all',
    )
    setIsGenerating(false)

    if (error) {
      toast({
        title: error.message === 'Popup blocked' ? 'Erro de Pop-up' : 'Erro ao gerar relatório',
        description:
          error.message === 'Popup blocked'
            ? 'Por favor, permita a abertura de pop-ups para exportar o relatório.'
            : 'Não foi possível buscar os dados do estoque.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-medium tracking-tight">Catálogo de Itens</h2>
          <p className="text-muted-foreground">
            Gerencie todos os materiais e medicamentos da unidade.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={handleExportPDF}
            variant="outline"
            className="w-full sm:w-auto gap-2 bg-background"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText size={16} strokeWidth={1.5} />
            )}
            {isGenerating ? 'Gerando...' : 'Gerar Relatório'}
          </Button>
          <div className="w-full sm:w-auto">
            <ItemFormModal />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex justify-between items-center text-amber-700">
              <span className="text-sm font-semibold uppercase tracking-wider">
                Estoque Crítico
              </span>
              <AlertTriangle className="h-4 w-4" />
            </div>
            <span className="text-2xl font-bold text-amber-700">{criticalItemsCount}</span>
          </CardContent>
        </Card>

        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex justify-between items-center text-destructive">
              <span className="text-sm font-semibold uppercase tracking-wider">Estoque Zerado</span>
              <PackageX className="h-4 w-4" />
            </div>
            <span className="text-2xl font-bold text-destructive">{zeroItemsCount}</span>
          </CardContent>
        </Card>

        <Card className="bg-orange-500/10 border-orange-500/20">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex justify-between items-center text-orange-700">
              <span className="text-sm font-semibold uppercase tracking-wider">
                Vence em ≤ 60 dias
              </span>
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-2xl font-bold text-orange-700">{expiringSoonItemsCount}</span>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/10 border-purple-500/20">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex justify-between items-center text-purple-700">
              <span className="text-sm font-semibold uppercase tracking-wider">
                Risco de Ruptura
              </span>
              <TrendingDown className="h-4 w-4" />
            </div>
            <span className="text-2xl font-bold text-purple-700">{stockoutRiskItemsCount}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b flex flex-col xl:flex-row gap-4 justify-between">
            <div className="relative w-full xl:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome ou código..."
                className="pl-9 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Tabs
              value={stockFilter}
              onValueChange={setStockFilter}
              className="w-full xl:w-auto overflow-x-auto"
            >
              <TabsList className="grid w-full min-w-[500px] grid-cols-5">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="critical">Crítico</TabsTrigger>
                <TabsTrigger value="zero">Zerado</TabsTrigger>
                <TabsTrigger value="expiring">Vencimento</TabsTrigger>
                <TabsTrigger value="stockout">Ruptura</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Item</TableHead>
                <TableHead>Lote / Validade</TableHead>
                <TableHead className="text-right">Estoque Atual</TableHead>
                <TableHead className="w-[200px]">Nível de Estoque</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    {stockFilter === 'critical'
                      ? 'Nenhum item com estoque crítico encontrado.'
                      : stockFilter === 'zero'
                        ? 'Nenhum item com estoque zerado encontrado.'
                        : stockFilter === 'expiring'
                          ? 'Nenhum item com validade próxima encontrado.'
                          : stockFilter === 'stockout'
                            ? 'Nenhum item com risco de ruptura encontrado.'
                            : 'Nenhum item encontrado.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const isZero = Number(item.current_quantity) === 0
                  const isCritical =
                    Number(item.current_quantity) > 0 &&
                    Number(item.current_quantity) <= Number(item.min_quantity)
                  const percentage = Math.min(
                    100,
                    Math.max(
                      0,
                      (Number(item.current_quantity) / (Number(item.min_quantity) * 2 || 1)) * 100,
                    ),
                  )

                  const { isStockoutRisk, daysUntilStockout, monthlyConsumption } =
                    calculateConsumption(item, movements)

                  let nearest = getNearestExpiry(item, movements)
                  let isExpired = false
                  let isExpiringSoon = false
                  let nearestExpiry = null
                  let nearestBatch = null

                  // Robust fallback: if item has 0 qty or no active batches but had IN movements with dates
                  if (!nearest && movements) {
                    const latestInWithExpiry = movements
                      .filter((m) => m.item_id === item.id && m.type === 'IN' && m.expiry_date)
                      .sort(
                        (a, b) =>
                          new Date(b.created_at || 0).getTime() -
                          new Date(a.created_at || 0).getTime(),
                      )[0]

                    if (latestInWithExpiry && latestInWithExpiry.expiry_date) {
                      const parsedDate = parseDateSafe(latestInWithExpiry.expiry_date)
                      if (parsedDate) {
                        nearest = {
                          date: parsedDate,
                          batch: latestInWithExpiry.batch_number,
                          movement_id: latestInWithExpiry.id,
                        }
                      }
                    }
                  }

                  if (nearest) {
                    nearestExpiry = nearest.date
                    nearestBatch = nearest.batch
                    // Only apply severe expiration styling if there is actual stock
                    if (Number(item.current_quantity) > 0) {
                      const diffDays =
                        (nearestExpiry.getTime() - today.getTime()) / (1000 * 3600 * 24)
                      if (diffDays < 0) {
                        isExpired = true
                      } else if (diffDays <= 60) {
                        isExpiringSoon = true
                      }
                    }
                  }

                  const rowHighlightClass = isZero
                    ? 'bg-destructive/5 hover:bg-destructive/10'
                    : isExpired
                      ? 'bg-destructive/5 hover:bg-destructive/10'
                      : isStockoutRisk
                        ? 'bg-purple-500/5 hover:bg-purple-500/10'
                        : isExpiringSoon || isCritical
                          ? 'bg-amber-500/5 hover:bg-amber-500/10'
                          : ''

                  return (
                    <TableRow key={item.id} className={rowHighlightClass}>
                      <TableCell>
                        <div className="font-medium text-foreground flex items-center gap-2 flex-wrap">
                          {formatItemDisplay(item)}
                          {isZero && (
                            <Badge
                              variant="destructive"
                              className="h-5 px-1.5 text-[10px] uppercase font-semibold"
                            >
                              Zerado
                            </Badge>
                          )}
                          {isExpired && !isZero && (
                            <Badge
                              variant="destructive"
                              className="h-5 px-1.5 text-[10px] uppercase font-semibold border-destructive bg-destructive"
                            >
                              Vencido
                            </Badge>
                          )}
                          {isStockoutRisk && !isZero && !isExpired && (
                            <Badge className="bg-purple-500 hover:bg-purple-600 text-white h-5 px-1.5 text-[10px] uppercase border-transparent font-semibold">
                              Risco de Ruptura
                            </Badge>
                          )}
                          {isCritical && !isZero && !isExpired && !isStockoutRisk && (
                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white h-5 px-1.5 text-[10px] uppercase border-transparent font-semibold">
                              Crítico
                            </Badge>
                          )}
                          {isExpiringSoon &&
                            !isZero &&
                            !isExpired &&
                            !isStockoutRisk &&
                            !isCritical && (
                              <Badge className="bg-orange-500 hover:bg-orange-600 text-white h-5 px-1.5 text-[10px] uppercase border-transparent font-semibold">
                                Vence em Breve
                              </Badge>
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground">{item.unit_type}</div>
                      </TableCell>
                      <TableCell>
                        {nearestExpiry ? (
                          <div className="flex flex-col gap-1">
                            <span
                              className={cn(
                                'font-medium flex items-center gap-1',
                                isExpired && !isZero
                                  ? 'text-destructive'
                                  : isExpiringSoon && !isZero
                                    ? 'text-orange-600'
                                    : isZero
                                      ? 'text-muted-foreground/70'
                                      : 'text-foreground',
                              )}
                            >
                              <CalendarIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
                              {format(nearestExpiry, 'dd/MM/yyyy')}
                            </span>
                            {nearestBatch && (
                              <span className="text-xs text-muted-foreground">
                                Lote: {nearestBatch}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            'font-mono text-base font-medium',
                            isZero && 'text-destructive font-bold',
                            isStockoutRisk && !isZero && 'text-purple-600 font-bold',
                            isCritical && !isZero && !isStockoutRisk && 'text-amber-600 font-bold',
                          )}
                        >
                          {item.current_quantity}
                        </span>
                        <div
                          className="text-[10px] text-muted-foreground mt-0.5"
                          title="Média de saída mensal"
                        >
                          Média: {monthlyConsumption}/mês
                        </div>
                        {isStockoutRisk && (
                          <div className="text-[10px] text-purple-600 font-bold mt-0.5 leading-tight">
                            Ruptura em ~{Math.round(daysUntilStockout)} dias
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                            <span>Min: {item.min_quantity}</span>
                            <span>{percentage > 100 ? '+100' : Math.round(percentage)}%</span>
                          </div>
                          <Progress
                            value={percentage}
                            className={cn(
                              'h-1.5 bg-muted',
                              isZero && '[&>div]:bg-destructive',
                              isStockoutRisk && !isZero && '[&>div]:bg-purple-500',
                              isCritical && !isZero && !isStockoutRisk && '[&>div]:bg-amber-500',
                              !isZero && !isCritical && !isStockoutRisk && '[&>div]:bg-secondary',
                            )}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <ItemRowActions item={item} />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
