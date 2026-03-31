import { useState, useMemo } from 'react'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { ItemFormModal } from '@/components/ItemFormModal'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  Search,
  FileText,
  Loader2,
  AlertTriangle,
  PackageX,
  Clock,
  TrendingDown,
} from 'lucide-react'
import { exportStockReportPdf } from '@/utils/exportPdf'
import { formatItemDisplay } from '@/utils/itemFormat'
import { getNearestExpiry } from '@/utils/expiryLogic'
import { calculateConsumption } from '@/utils/consumptionLogic'
import { getPotentialDuplicateIds } from '@/utils/duplicateLogic'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ItemTableRow } from '@/components/ItemTableRow'

export default function Items() {
  const { items, movements } = useInventoryStore()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [isGenerating, setIsGenerating] = useState(false)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const duplicateIds = useMemo(() => getPotentialDuplicateIds(items), [items])

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
    if (stockFilter === 'expiring-60') {
      if (Number(item.current_quantity) === 0) return false
      const nearest = getNearestExpiry(item, movements)
      if (!nearest) return false
      const diffDays = (nearest.date.getTime() - today.getTime()) / (1000 * 3600 * 24)
      return diffDays >= 0 && diffDays <= 60
    }
    if (stockFilter === 'expiring-120') {
      if (Number(item.current_quantity) === 0) return false
      const nearest = getNearestExpiry(item, movements)
      if (!nearest) return false
      const diffDays = (nearest.date.getTime() - today.getTime()) / (1000 * 3600 * 24)
      return diffDays > 60 && diffDays <= 120
    }
    if (stockFilter === 'stockout') {
      if (Number(item.current_quantity) === 0) return false
      const { isStockoutRisk } = calculateConsumption(item, movements)
      return isStockoutRisk
    }
    return true
  })

  if (stockFilter === 'expiring-60' || stockFilter === 'expiring-120') {
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

  const criticalItemsCount = items.filter(
    (item) =>
      Number(item.current_quantity) > 0 &&
      Number(item.current_quantity) <= Number(item.min_quantity),
  ).length

  const zeroItemsCount = items.filter((item) => Number(item.current_quantity) === 0).length

  const expiring60DaysCount = items.filter((item) => {
    if (Number(item.current_quantity) === 0) return false
    const nearest = getNearestExpiry(item, movements)
    if (!nearest) return false
    const diffDays = (nearest.date.getTime() - today.getTime()) / (1000 * 3600 * 24)
    return diffDays >= 0 && diffDays <= 60
  }).length

  const expiring120DaysCount = items.filter((item) => {
    if (Number(item.current_quantity) === 0) return false
    const nearest = getNearestExpiry(item, movements)
    if (!nearest) return false
    const diffDays = (nearest.date.getTime() - today.getTime()) / (1000 * 3600 * 24)
    return diffDays > 60 && diffDays <= 120
  }).length

  const stockoutRiskItemsCount = items.filter((item) => {
    if (Number(item.current_quantity) === 0) return false
    return calculateConsumption(item, movements).isStockoutRisk
  }).length

  const handleExportPDF = async () => {
    setIsGenerating(true)
    const { error } = await exportStockReportPdf(
      ['critical', 'zero', 'expiring-60', 'expiring-120', 'stockout'].includes(stockFilter)
        ? stockFilter
        : 'all',
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex justify-between items-center text-destructive">
              <span className="text-xs lg:text-sm font-semibold uppercase tracking-wider">
                Zerado
              </span>
              <PackageX className="h-4 w-4" />
            </div>
            <span className="text-2xl font-bold text-destructive">{zeroItemsCount}</span>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex justify-between items-center text-amber-700">
              <span className="text-xs lg:text-sm font-semibold uppercase tracking-wider">
                Crítico
              </span>
              <AlertTriangle className="h-4 w-4" />
            </div>
            <span className="text-2xl font-bold text-amber-700">{criticalItemsCount}</span>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/10 border-purple-500/20">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex justify-between items-center text-purple-700">
              <span className="text-xs lg:text-sm font-semibold uppercase tracking-wider">
                Ruptura
              </span>
              <TrendingDown className="h-4 w-4" />
            </div>
            <span className="text-2xl font-bold text-purple-700">{stockoutRiskItemsCount}</span>
          </CardContent>
        </Card>

        <Card className="bg-yellow-500/10 border-yellow-500/20">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex justify-between items-center text-yellow-700">
              <span className="text-xs lg:text-sm font-semibold uppercase tracking-wider">
                ≤ 120 dias
              </span>
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-2xl font-bold text-yellow-700">{expiring120DaysCount}</span>
          </CardContent>
        </Card>

        <Card className="bg-orange-500/10 border-orange-500/20">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex justify-between items-center text-orange-700">
              <span className="text-xs lg:text-sm font-semibold uppercase tracking-wider">
                ≤ 60 dias
              </span>
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-2xl font-bold text-orange-700">{expiring60DaysCount}</span>
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
              <TabsList className="grid w-full min-w-[600px] grid-cols-6">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="critical">Crítico</TabsTrigger>
                <TabsTrigger value="zero">Zerado</TabsTrigger>
                <TabsTrigger value="expiring-120">≤ 120 Dias</TabsTrigger>
                <TabsTrigger value="expiring-60">≤ 60 Dias</TabsTrigger>
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
                        : stockFilter === 'expiring-60'
                          ? 'Nenhum item vencendo em 60 dias ou menos encontrado.'
                          : stockFilter === 'expiring-120'
                            ? 'Nenhum item vencendo em 120 dias ou menos encontrado.'
                            : stockFilter === 'stockout'
                              ? 'Nenhum item com risco de ruptura encontrado.'
                              : 'Nenhum item encontrado.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <ItemTableRow
                    key={item.id}
                    item={item}
                    movements={movements}
                    today={today}
                    isDuplicate={duplicateIds.has(item.id)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
