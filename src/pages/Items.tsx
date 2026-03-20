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
import { Search, FileText, Loader2, CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { exportStockReportPdf } from '@/utils/exportPdf'
import { formatItemDisplay } from '@/utils/itemFormat'
import { getNearestExpiry } from '@/utils/expiryLogic'
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
      return diffDays <= 180
    }
    return true
  })

  // If filtering by expiring, sort by nearest expiry
  if (stockFilter === 'expiring') {
    filteredItems.sort((a, b) => {
      const nearestA = getNearestExpiry(a, movements)
      const nearestB = getNearestExpiry(b, movements)
      if (!nearestA) return 1
      if (!nearestB) return -1
      return nearestA.date.getTime() - nearestB.date.getTime()
    })
  }

  const handleExportPDF = async () => {
    setIsGenerating(true)
    const { error } = await exportStockReportPdf()
    setIsGenerating(false)

    if (error) {
      toast({
        title: error.message === 'Popup blocked' ? 'Erro de Pop-up' : 'Erro ao gerar relatório',
        description:
          error.message === 'Popup blocked'
            ? 'Por favor, permita a abertura de pop-ups para exportar o relatório PDF.'
            : 'Não foi possível buscar os dados mais recentes do estoque.',
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
              <TabsList className="grid w-full min-w-[400px] grid-cols-4">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="critical">Crítico</TabsTrigger>
                <TabsTrigger value="zero">Zerado</TabsTrigger>
                <TabsTrigger value="expiring">Vencimento</TabsTrigger>
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
                          ? 'Nenhum item próximo ao vencimento encontrado.'
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

                  // Expiry Logic using active batches
                  const nearest = getNearestExpiry(item, movements)
                  let isExpired = false
                  let isExpiringSoon = false
                  let nearestExpiry = null
                  let nearestBatch = null

                  if (nearest && Number(item.current_quantity) > 0) {
                    nearestExpiry = nearest.date
                    nearestBatch = nearest.batch
                    const diffDays =
                      (nearestExpiry.getTime() - today.getTime()) / (1000 * 3600 * 24)

                    if (diffDays < 0) {
                      isExpired = true
                    } else if (diffDays <= 180) {
                      isExpiringSoon = true
                    }
                  }

                  const rowHighlightClass = isZero
                    ? 'bg-destructive/5 hover:bg-destructive/10'
                    : isExpired
                      ? 'bg-destructive/5 hover:bg-destructive/10'
                      : isCritical || isExpiringSoon
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
                          {isCritical && (
                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white h-5 px-1.5 text-[10px] uppercase border-transparent font-semibold">
                              Crítico
                            </Badge>
                          )}
                          {isExpired && (
                            <Badge
                              variant="destructive"
                              className="h-5 px-1.5 text-[10px] uppercase font-semibold border-destructive bg-destructive"
                            >
                              Vencido
                            </Badge>
                          )}
                          {isExpiringSoon && !isExpired && (
                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white h-5 px-1.5 text-[10px] uppercase border-transparent font-semibold">
                              Vencimento Próximo
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
                                isExpired
                                  ? 'text-destructive'
                                  : isExpiringSoon
                                    ? 'text-amber-600'
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
                            isCritical && 'text-amber-600 font-bold',
                          )}
                        >
                          {item.current_quantity}
                        </span>
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
                              isCritical && '[&>div]:bg-amber-500',
                              !isZero && !isCritical && '[&>div]:bg-secondary',
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
