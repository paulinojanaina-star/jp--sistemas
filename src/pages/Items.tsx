import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { getNearestExpiry } from '@/utils/expiryLogic'
import { calculateConsumption } from '@/utils/consumptionLogic'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ItemFormModal } from '@/components/ItemFormModal'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Search,
  Plus,
  FileText,
  PackageX,
  AlertTriangle,
  TrendingDown,
  Clock,
  AlertOctagon,
  Trash,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Items() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { items, movements, deleteItem } = useInventoryStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [itemToDelete, setItemToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!itemToDelete) return
    setIsDeleting(true)
    const { error } = await deleteItem(itemToDelete.id)
    setIsDeleting(false)

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o item.',
        variant: 'destructive',
      })
      return
    }

    toast({ title: 'Sucesso!', description: 'Item excluído com sucesso.' })
    setItemToDelete(null)
  }

  const currentFilter = searchParams.get('filter') || 'todos'

  const setFilter = (filter: string) => {
    if (filter === 'todos') {
      searchParams.delete('filter')
    } else {
      searchParams.set('filter', filter)
    }
    setSearchParams(searchParams)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const itemsWithStats = useMemo(() => {
    return items.map((item) => {
      const currentQty = Number(item.current_quantity) || 0
      const minQty = Number(item.min_quantity) || 0

      const nearestExpiryData = getNearestExpiry(item, movements)
      let diffDays = Infinity
      let isExpired = false
      if (nearestExpiryData) {
        diffDays = (nearestExpiryData.date.getTime() - today.getTime()) / (1000 * 3600 * 24)
        isExpired = diffDays < 0
      }

      const { isStockoutRisk, monthlyConsumption, daysUntilStockout } = calculateConsumption(
        item,
        movements,
      )

      return {
        ...item,
        currentQty,
        minQty,
        nearestExpiryData,
        diffDays,
        isExpired,
        isStockoutRisk,
        monthlyConsumption,
        daysUntilStockout,
        isZerado: currentQty <= 0,
        isCritico: currentQty > 0 && currentQty < minQty,
      }
    })
  }, [items, movements, today])

  const stats = useMemo(() => {
    return {
      zerado: itemsWithStats.filter((i) => i.isZerado).length,
      critico: itemsWithStats.filter((i) => i.isCritico).length,
      ruptura: itemsWithStats.filter((i) => i.isStockoutRisk).length,
      dias120: itemsWithStats.filter((i) => !i.isExpired && i.diffDays <= 120 && i.diffDays > 60)
        .length,
      dias60: itemsWithStats.filter((i) => !i.isExpired && i.diffDays <= 60).length,
      vencidos: itemsWithStats.filter((i) => i.isExpired).length,
    }
  }, [itemsWithStats])

  const filteredItems = useMemo(() => {
    return itemsWithStats.filter((item) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = item.name.toLowerCase().includes(query)
        const matchesDesc = item.description?.toLowerCase().includes(query)
        if (!matchesName && !matchesDesc) return false
      }

      switch (currentFilter) {
        case 'zerado':
          return item.isZerado
        case 'critico':
          return item.isCritico
        case 'ruptura':
          return item.isStockoutRisk
        case '120dias':
        case 'vencimento_proximo':
          return !item.isExpired && item.diffDays <= 120 && item.diffDays > 60
        case '60dias':
          return !item.isExpired && item.diffDays <= 60
        case 'vencidos':
          return item.isExpired
        default:
          return true
      }
    })
  }, [itemsWithStats, searchQuery, currentFilter])

  return (
    <div className="space-y-6 p-4 md:p-8 animate-fade-in-up max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Catálogo de Itens</h1>
          <p className="text-muted-foreground font-medium mt-1">
            Gerencie todos os materiais e medicamentos da unidade.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 font-bold shadow-sm">
            <FileText className="h-4 w-4" />
            Gerar Relatório
          </Button>
          <ItemFormModal
            trigger={
              <Button className="gap-2 font-bold shadow-sm bg-slate-800 hover:bg-slate-700 text-white">
                <Plus className="h-4 w-4" />
                Novo Item
              </Button>
            }
          />
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
        <Card
          className={cn(
            'min-w-[150px] flex-1 cursor-pointer transition-all hover:-translate-y-1 rounded-2xl snap-start',
            currentFilter === 'zerado'
              ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-500/10 border-red-200'
              : 'bg-red-50/50 dark:bg-red-500/5 border-red-100',
          )}
          onClick={() => setFilter(currentFilter === 'zerado' ? 'todos' : 'zerado')}
        >
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[100px]">
            <div className="flex items-start justify-between text-red-600 mb-2">
              <span className="font-bold text-xs tracking-wider uppercase">Zerado</span>
              <PackageX className="h-4 w-4 opacity-70" />
            </div>
            <div className="text-3xl font-black text-red-500">{stats.zerado}</div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'min-w-[150px] flex-1 cursor-pointer transition-all hover:-translate-y-1 rounded-2xl snap-start',
            currentFilter === 'critico'
              ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-500/10 border-orange-200'
              : 'bg-orange-50/50 dark:bg-orange-500/5 border-orange-100',
          )}
          onClick={() => setFilter(currentFilter === 'critico' ? 'todos' : 'critico')}
        >
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[100px]">
            <div className="flex items-start justify-between text-orange-700 mb-2">
              <span className="font-bold text-xs tracking-wider uppercase">Crítico</span>
              <AlertTriangle className="h-4 w-4 opacity-70" />
            </div>
            <div className="text-3xl font-black text-orange-600">{stats.critico}</div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'min-w-[150px] flex-1 cursor-pointer transition-all hover:-translate-y-1 rounded-2xl snap-start',
            currentFilter === 'ruptura'
              ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-500/10 border-purple-200'
              : 'bg-purple-50/50 dark:bg-purple-500/5 border-purple-100',
          )}
          onClick={() => setFilter(currentFilter === 'ruptura' ? 'todos' : 'ruptura')}
        >
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[100px]">
            <div className="flex items-start justify-between text-purple-700 mb-2">
              <span className="font-bold text-xs tracking-wider uppercase">Ruptura</span>
              <TrendingDown className="h-4 w-4 opacity-70" />
            </div>
            <div className="text-3xl font-black text-purple-600">{stats.ruptura}</div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'min-w-[150px] flex-1 cursor-pointer transition-all hover:-translate-y-1 rounded-2xl snap-start',
            currentFilter === '120dias' || currentFilter === 'vencimento_proximo'
              ? 'ring-2 ring-yellow-600 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200'
              : 'bg-yellow-50/50 dark:bg-yellow-500/5 border-yellow-100',
          )}
          onClick={() => setFilter(currentFilter === '120dias' ? 'todos' : '120dias')}
        >
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[100px]">
            <div className="flex items-start justify-between text-yellow-700 mb-2">
              <span className="font-bold text-xs tracking-wider uppercase">≤ 120 Dias</span>
              <Clock className="h-4 w-4 opacity-70" />
            </div>
            <div className="text-3xl font-black text-yellow-600">{stats.dias120}</div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'min-w-[150px] flex-1 cursor-pointer transition-all hover:-translate-y-1 rounded-2xl snap-start',
            currentFilter === '60dias'
              ? 'ring-2 ring-amber-600 bg-amber-50 dark:bg-amber-600/10 border-amber-200'
              : 'bg-amber-50/50 dark:bg-amber-600/5 border-amber-100',
          )}
          onClick={() => setFilter(currentFilter === '60dias' ? 'todos' : '60dias')}
        >
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[100px]">
            <div className="flex items-start justify-between text-amber-700 mb-2">
              <span className="font-bold text-xs tracking-wider uppercase">≤ 60 Dias</span>
              <Clock className="h-4 w-4 opacity-70" />
            </div>
            <div className="text-3xl font-black text-amber-600">{stats.dias60}</div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'min-w-[150px] flex-1 cursor-pointer transition-all hover:-translate-y-1 rounded-2xl snap-start border-destructive/30',
            currentFilter === 'vencidos'
              ? 'ring-2 ring-destructive bg-destructive/10'
              : 'bg-destructive/5',
          )}
          onClick={() => setFilter(currentFilter === 'vencidos' ? 'todos' : 'vencidos')}
        >
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[100px]">
            <div className="flex items-start justify-between text-destructive mb-2">
              <span className="font-bold text-xs tracking-wider uppercase">Vencidos</span>
              <AlertOctagon className="h-4 w-4 opacity-70" />
            </div>
            <div className="text-3xl font-black text-destructive">{stats.vencidos}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/50 flex flex-col xl:flex-row gap-4 items-center justify-between bg-card">
          <div className="relative w-full xl:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome ou código..."
              className="pl-9 bg-background rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-border/50 overflow-x-auto w-full xl:w-auto">
            <Button
              variant={currentFilter === 'todos' ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'rounded-lg text-sm font-bold whitespace-nowrap',
                currentFilter === 'todos' ? 'shadow-sm' : 'text-muted-foreground',
              )}
              onClick={() => setFilter('todos')}
            >
              Todos
            </Button>
            <Button
              variant={currentFilter === 'critico' ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'rounded-lg text-sm font-bold whitespace-nowrap',
                currentFilter === 'critico'
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                  : 'text-orange-600 dark:text-orange-400',
              )}
              onClick={() => setFilter('critico')}
            >
              Crítico
            </Button>
            <Button
              variant={currentFilter === 'zerado' ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'rounded-lg text-sm font-bold whitespace-nowrap',
                currentFilter === 'zerado'
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-sm'
                  : 'text-red-600 dark:text-red-400',
              )}
              onClick={() => setFilter('zerado')}
            >
              Zerado
            </Button>
            <Button
              variant={
                currentFilter === '120dias' || currentFilter === 'vencimento_proximo'
                  ? 'default'
                  : 'ghost'
              }
              size="sm"
              className={cn(
                'rounded-lg text-sm font-bold whitespace-nowrap',
                currentFilter === '120dias' || currentFilter === 'vencimento_proximo'
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm'
                  : 'text-yellow-600 dark:text-yellow-400',
              )}
              onClick={() => setFilter('120dias')}
            >
              ≤ 120 Dias
            </Button>
            <Button
              variant={currentFilter === '60dias' ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'rounded-lg text-sm font-bold whitespace-nowrap',
                currentFilter === '60dias'
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                  : 'text-amber-600 dark:text-amber-500',
              )}
              onClick={() => setFilter('60dias')}
            >
              ≤ 60 Dias
            </Button>
            <Button
              variant={currentFilter === 'ruptura' ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'rounded-lg text-sm font-bold whitespace-nowrap',
                currentFilter === 'ruptura'
                  ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-sm'
                  : 'text-purple-600 dark:text-purple-400',
              )}
              onClick={() => setFilter('ruptura')}
            >
              Ruptura
            </Button>
            <Button
              variant={currentFilter === 'vencidos' ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'rounded-lg text-sm font-bold whitespace-nowrap',
                currentFilter === 'vencidos'
                  ? 'bg-destructive hover:bg-destructive/90 text-white shadow-sm'
                  : 'text-destructive',
              )}
              onClick={() => setFilter('vencidos')}
            >
              Vencidos
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <TableHead className="font-bold h-12">Item</TableHead>
                <TableHead className="font-bold h-12">Estoque Atual</TableHead>
                <TableHead className="font-bold h-12">Estoque Mín.</TableHead>
                <TableHead className="font-bold h-12">Média Mensal</TableHead>
                {currentFilter === 'ruptura' && (
                  <TableHead className="font-bold h-12">Duração Est.</TableHead>
                )}
                <TableHead className="font-bold h-12">Status</TableHead>
                <TableHead className="font-bold h-12 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={currentFilter === 'ruptura' ? 7 : 6}
                    className="text-center py-16 text-muted-foreground"
                  >
                    <PackageX className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                    <p className="font-bold text-lg">Nenhum item encontrado</p>
                    <p className="text-sm">Ajuste os filtros ou o termo de busca.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-4">
                      <div className="font-bold text-foreground text-[15px]">{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground font-medium mt-0.5 truncate max-w-[300px]">
                          {item.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-black text-lg text-slate-700 dark:text-slate-300">
                        {item.currentQty}{' '}
                        <span className="text-xs font-bold text-muted-foreground uppercase">
                          {item.unit_type || 'UN'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-bold text-muted-foreground">{item.minQty}</div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-bold text-slate-600 dark:text-slate-400">
                        {item.monthlyConsumption}{' '}
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">
                          /mês
                        </span>
                      </div>
                    </TableCell>
                    {currentFilter === 'ruptura' && (
                      <TableCell className="py-4">
                        <div className="font-bold text-purple-600 dark:text-purple-400">
                          {item.daysUntilStockout !== Infinity
                            ? `${Math.ceil(item.daysUntilStockout)} dias`
                            : '-'}
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {item.isExpired && (
                          <Badge
                            variant="destructive"
                            className="font-extrabold uppercase text-[10px]"
                          >
                            Vencido
                          </Badge>
                        )}
                        {item.isZerado && (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:border-red-500/30 font-bold uppercase text-[10px]"
                          >
                            Zerado
                          </Badge>
                        )}
                        {item.isCritico && (
                          <Badge
                            variant="outline"
                            className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/30 font-bold uppercase text-[10px]"
                          >
                            Crítico
                          </Badge>
                        )}
                        {item.isStockoutRisk && (
                          <Badge
                            variant="outline"
                            className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/30 font-bold uppercase text-[10px]"
                          >
                            Ruptura
                          </Badge>
                        )}
                        {!item.isExpired && item.diffDays <= 60 && (
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-600/10 dark:border-amber-600/30 font-bold uppercase text-[10px]"
                          >
                            ≤ 60d
                          </Badge>
                        )}
                        {!item.isExpired && item.diffDays > 60 && item.diffDays <= 120 && (
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/30 font-bold uppercase text-[10px]"
                          >
                            ≤ 120d
                          </Badge>
                        )}

                        {!item.isExpired &&
                          !item.isZerado &&
                          !item.isCritico &&
                          !item.isStockoutRisk &&
                          item.diffDays > 120 && (
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 font-bold uppercase text-[10px]"
                            >
                              Regular
                            </Badge>
                          )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ItemFormModal
                          item={item}
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                              className="font-bold text-primary hover:bg-primary/10 border-primary/20"
                            >
                              Editar
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setItemToDelete(item)}
                          className="font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Excluir item"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza que deseja excluir este item?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A exclusão deste item removerá também todo o
              histórico de movimentações associado a ele no banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
