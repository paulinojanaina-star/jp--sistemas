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

  const filteredItems = items.filter((item) => {
    const formattedName = formatItemDisplay(item).toLowerCase()
    const matchesSearch = formattedName.includes(search.toLowerCase())
    if (!matchesSearch) return false

    if (stockFilter === 'critical')
      return item.current_quantity > 0 && item.current_quantity <= item.min_quantity
    if (stockFilter === 'zero') return item.current_quantity === 0
    return true
  })

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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Catálogo de Itens</h2>
          <p className="text-muted-foreground">
            Gerencie todos os materiais e medicamentos da unidade.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={handleExportPDF}
            variant="outline"
            className="w-full sm:w-auto gap-2 bg-white dark:bg-slate-950"
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText size={16} />}
            {isGenerating ? 'Gerando...' : 'Gerar Relatório'}
          </Button>
          <div className="w-full sm:w-auto">
            <ItemFormModal />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome ou código..."
                className="pl-9 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Tabs value={stockFilter} onValueChange={setStockFilter} className="w-full md:w-auto">
              <TabsList className="grid w-full grid-cols-3 md:w-[350px]">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="critical">Crítico</TabsTrigger>
                <TabsTrigger value="zero">Zerado</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Estoque Atual</TableHead>
                <TableHead className="w-[200px]">Nível de Estoque</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    {stockFilter === 'critical'
                      ? 'Nenhum item com estoque crítico encontrado.'
                      : stockFilter === 'zero'
                        ? 'Nenhum item com estoque zerado encontrado.'
                        : 'Nenhum item encontrado.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const isZero = item.current_quantity === 0
                  const isCritical =
                    item.current_quantity > 0 && item.current_quantity <= item.min_quantity
                  const percentage = Math.min(
                    100,
                    Math.max(0, (item.current_quantity / (item.min_quantity * 2 || 1)) * 100),
                  )

                  // Expiry Logic using active batches
                  const nearest = getNearestExpiry(item, movements)
                  let isExpired = false
                  let isExpiringSoon = false
                  let nearestExpiry = null

                  if (nearest) {
                    nearestExpiry = nearest.date
                    const diffDays =
                      (nearestExpiry.getTime() - today.getTime()) / (1000 * 3600 * 24)

                    if (diffDays < 0) {
                      isExpired = true
                    } else if (diffDays <= 180) {
                      isExpiringSoon = true
                    }
                  }

                  return (
                    <TableRow
                      key={item.id}
                      className={cn(
                        isZero && 'bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50/80',
                        isCritical && 'bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/50',
                      )}
                    >
                      <TableCell>
                        <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                          {formatItemDisplay(item)}
                          {isZero && (
                            <Badge
                              variant="destructive"
                              className="h-5 px-1.5 text-[10px] uppercase"
                            >
                              Zerado
                            </Badge>
                          )}
                          {isCritical && (
                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white h-5 px-1.5 text-[10px] uppercase border-transparent">
                              Crítico
                            </Badge>
                          )}
                          {isExpired && (
                            <Badge
                              variant="destructive"
                              className="h-5 px-1.5 text-[10px] uppercase border-red-700 bg-red-600"
                            >
                              Vencido
                            </Badge>
                          )}
                          {isExpiringSoon && (
                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white h-5 px-1.5 text-[10px] uppercase border-transparent">
                              Vencimento Próximo
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{item.unit_type}</div>
                        {nearestExpiry && item.current_quantity > 0 && (
                          <div className="text-xs mt-1 text-muted-foreground flex items-center gap-1 font-medium">
                            <CalendarIcon
                              className={`h-3 w-3 ${isExpired ? 'text-red-500' : isExpiringSoon ? 'text-amber-500' : ''}`}
                            />
                            <span
                              className={
                                isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : ''
                              }
                            >
                              Vencimento (Lote Ativo): {format(nearestExpiry, 'dd/MM/yyyy')}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            'font-mono text-base font-medium',
                            isZero && 'text-destructive font-bold',
                            isCritical && 'text-amber-600 dark:text-amber-500 font-bold',
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
                              'h-1.5',
                              isZero && 'bg-red-100 dark:bg-red-950 [&>div]:bg-destructive',
                              isCritical &&
                                'bg-amber-100 dark:bg-amber-950/30 [&>div]:bg-amber-500',
                              !isZero && !isCritical && '[&>div]:bg-emerald-500',
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
