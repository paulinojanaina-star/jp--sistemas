import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Filter,
  Layers,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react'
import { Item } from '@/types/inventory'
import { formatItemDisplay } from '@/utils/itemFormat'

export interface CountItemRow {
  item: Item
  systemQuantity: number
  countedText: string // String digitada para manter edição suave
  countedQuantity: number // Número interpretado
  isCounted: boolean
  difference: number // counted - system
  notes: string
}

interface InventoryCountStepProps {
  items: Item[]
  healthUnit: string
  onGoToReview: (countedRows: CountItemRow[]) => void
}

export function InventoryCountStep({ items, healthUnit, onGoToReview }: InventoryCountStepProps) {
  const [search, setSearch] = useState('')
  const [filterMode, setFilterMode] = useState<'ALL' | 'DIVERGENT' | 'CHECKED' | 'UNCHECKED'>('ALL')
  const [page, setPage] = useState(1)
  const pageSize = 15

  // Estado de contagem indexado por item.id
  const [counts, setCounts] = useState<
    Record<
      string,
      {
        countedText: string
        isCounted: boolean
        notes: string
      }
    >
  >({})

  const rows: CountItemRow[] = useMemo(() => {
    return items.map((item) => {
      const state = counts[item.id]
      const systemQuantity = Number(item.current_quantity) || 0
      const isCounted = !!state?.isCounted
      const countedText = state ? state.countedText : ''
      const countedQuantity =
        isCounted && countedText !== '' ? Number(countedText) || 0 : systemQuantity
      const difference = isCounted ? countedQuantity - systemQuantity : 0
      const notes = state?.notes || ''

      return {
        item,
        systemQuantity,
        countedText,
        countedQuantity,
        isCounted,
        difference,
        notes,
      }
    })
  }, [items, counts])

  const stats = useMemo(() => {
    let totalItems = rows.length
    let totalChecked = 0
    let totalDivergent = 0
    let positiveAdjustments = 0
    let negativeAdjustments = 0

    rows.forEach((r) => {
      if (r.isCounted) {
        totalChecked += 1
        if (r.difference > 0) {
          totalDivergent += 1
          positiveAdjustments += 1
        } else if (r.difference < 0) {
          totalDivergent += 1
          negativeAdjustments += 1
        }
      }
    })

    return {
      totalItems,
      totalChecked,
      totalDivergent,
      positiveAdjustments,
      negativeAdjustments,
      okCount: totalChecked - totalDivergent,
    }
  }, [rows])

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const display = formatItemDisplay(r.item).toLowerCase()
      const matchSearch =
        display.includes(search.toLowerCase()) ||
        (r.item.supplier || '').toLowerCase().includes(search.toLowerCase())

      if (!matchSearch) return false

      if (filterMode === 'DIVERGENT') {
        return r.isCounted && r.difference !== 0
      }
      if (filterMode === 'CHECKED') {
        return r.isCounted
      }
      if (filterMode === 'UNCHECKED') {
        return !r.isCounted
      }
      return true
    })
  }, [rows, search, filterMode])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  const handleCountChange = (itemId: string, text: string) => {
    setCounts((prev) => ({
      ...prev,
      [itemId]: {
        countedText: text,
        isCounted: text !== '',
        notes: prev[itemId]?.notes || '',
      },
    }))
  }

  const handleNotesChange = (itemId: string, notes: string) => {
    setCounts((prev) => ({
      ...prev,
      [itemId]: {
        countedText: prev[itemId]?.countedText ?? '',
        isCounted: prev[itemId]?.isCounted ?? false,
        notes,
      },
    }))
  }

  const handleMatchSystem = (itemId: string, sysQty: number) => {
    handleCountChange(itemId, String(sysQty))
  }

  const handleMatchAllSystem = () => {
    setCounts((prev) => {
      const next = { ...prev }
      items.forEach((it) => {
        if (!next[it.id]?.isCounted) {
          next[it.id] = {
            countedText: String(Number(it.current_quantity) || 0),
            isCounted: true,
            notes: next[it.id]?.notes || '',
          }
        }
      })
      return next
    })
  }

  const handleResetCounts = () => {
    if (confirm('Tem certeza de que deseja limpar todas as contagens digitadas?')) {
      setCounts({})
      setPage(1)
    }
  }

  const handleAdvance = () => {
    const countedRows = rows.filter((r) => r.isCounted)
    if (countedRows.length === 0) {
      alert('Preencha a contagem de pelo menos um item antes de avançar para a revisão.')
      return
    }
    onGoToReview(countedRows)
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo em Tempo Real */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-slate-900 text-white border-slate-800">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-blue-400" /> Total Itens
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-[11px] text-slate-400">no catálogo</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-border">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <FileCheck className="h-3.5 w-3.5 text-primary" /> Conferidos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold text-primary">
              {stats.totalChecked}
              <span className="text-xs text-muted-foreground font-normal">
                {' '}
                / {stats.totalItems}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {stats.totalItems > 0
                ? `${Math.round((stats.totalChecked / stats.totalItems) * 100)}% concluído`
                : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Sem Divergência
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {stats.okCount}
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400/80">conferidos, ok</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <ArrowUpRight className="h-3.5 w-3.5 text-amber-600" /> Sobras (+ Entrada)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.positiveAdjustments}
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-400/80">
              físico maior que sistema
            </p>
          </CardContent>
        </Card>

        <Card className="bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" /> Faltas (- Perda)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {stats.negativeAdjustments}
            </div>
            <p className="text-[11px] text-rose-700 dark:text-rose-400/80">
              físico menor que sistema
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros e Ações Rápidas */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                strokeWidth={1.5}
              />
              <Input
                placeholder="Buscar item pelo nome ou fornecedor..."
                className="pl-9 bg-background"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Exibir:
              </span>
              <Button
                variant={filterMode === 'ALL' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-8"
                onClick={() => {
                  setFilterMode('ALL')
                  setPage(1)
                }}
              >
                Todos ({rows.length})
              </Button>
              <Button
                variant={filterMode === 'DIVERGENT' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-8 text-amber-600 dark:text-amber-400"
                onClick={() => {
                  setFilterMode('DIVERGENT')
                  setPage(1)
                }}
              >
                Divergências ({stats.totalDivergent})
              </Button>
              <Button
                variant={filterMode === 'CHECKED' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-8"
                onClick={() => {
                  setFilterMode('CHECKED')
                  setPage(1)
                }}
              >
                Conferidos ({stats.totalChecked})
              </Button>
              <Button
                variant={filterMode === 'UNCHECKED' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-8"
                onClick={() => {
                  setFilterMode('UNCHECKED')
                  setPage(1)
                }}
              >
                Pendentes ({rows.length - stats.totalChecked})
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>
                Unidade ativa: <strong className="text-foreground">{healthUnit}</strong>
              </span>
              <span>•</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleMatchAllSystem}
                title="Preenche todos os itens ainda vazios com o saldo atual do sistema"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1 text-primary" /> Preencher não contados com
                saldo do sistema
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-rose-500 hover:text-rose-600"
                onClick={handleResetCounts}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Limpar contagem
              </Button>
            </div>

            <Button
              onClick={handleAdvance}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md ml-auto"
              disabled={stats.totalChecked === 0}
            >
              Revisar e Justificar Contagem ({stats.totalChecked} itens)
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Contagem */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[30%]">Item</TableHead>
                <TableHead className="w-[12%] text-center">Unidade Medida</TableHead>
                <TableHead className="w-[14%] text-right font-medium">Saldo Sistema</TableHead>
                <TableHead className="w-[18%] text-center">Qtd Contada (Físico)</TableHead>
                <TableHead className="w-[14%] text-center">Divergência</TableHead>
                <TableHead className="w-[12%]">Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                    Nenhum item corresponde ao filtro selecionado.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row) => {
                  const isDivergent = row.isCounted && row.difference !== 0
                  const isPositive = row.difference > 0
                  const isNegative = row.difference < 0

                  return (
                    <TableRow
                      key={row.item.id}
                      className={
                        isDivergent
                          ? isPositive
                            ? 'bg-amber-50/50 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                            : 'bg-rose-50/50 dark:bg-rose-950/10 hover:bg-rose-50 dark:hover:bg-rose-950/20'
                          : row.isCounted
                            ? 'bg-emerald-50/30 dark:bg-emerald-950/5'
                            : ''
                      }
                    >
                      {/* Item */}
                      <TableCell>
                        <div className="font-semibold text-foreground">
                          {formatItemDisplay(row.item)}
                        </div>
                        {row.item.supplier && (
                          <div className="text-xs text-muted-foreground">
                            Fornecedor: {row.item.supplier}
                          </div>
                        )}
                      </TableCell>

                      {/* Unidade */}
                      <TableCell className="text-center text-xs text-muted-foreground">
                        <Badge variant="outline" className="font-normal">
                          {row.item.unit_type || 'Unidade'}
                        </Badge>
                      </TableCell>

                      {/* Saldo Sistema (somente leitura) */}
                      <TableCell className="text-right font-mono font-bold text-foreground">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-base">{row.systemQuantity}</span>
                          {!row.isCounted && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                              onClick={() => handleMatchSystem(row.item.id, row.systemQuantity)}
                              title="Copiar saldo do sistema como conferido"
                            >
                              Copiar
                            </Button>
                          )}
                        </div>
                      </TableCell>

                      {/* Quantidade Contada (Digitação) */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 max-w-[140px] mx-auto">
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            placeholder={String(row.systemQuantity)}
                            value={row.countedText}
                            onChange={(e) => handleCountChange(row.item.id, e.target.value)}
                            className={`h-9 text-center font-mono font-bold text-base ${
                              isDivergent
                                ? isPositive
                                  ? 'border-amber-400 bg-amber-50/60 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                                  : 'border-rose-400 bg-rose-50/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                                : row.isCounted
                                  ? 'border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-background'
                            }`}
                          />
                        </div>
                      </TableCell>

                      {/* Divergência destacada em tempo real */}
                      <TableCell className="text-center">
                        {!row.isCounted ? (
                          <span className="text-xs text-muted-foreground italic">
                            Não conferido
                          </span>
                        ) : row.difference === 0 ? (
                          <Badge
                            variant="outline"
                            className="text-emerald-700 dark:text-emerald-400 border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 font-medium"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Exato (0)
                          </Badge>
                        ) : isPositive ? (
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-mono font-bold">
                            <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />+{row.difference} (Sobra)
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-600 hover:bg-rose-700 text-white font-mono font-bold">
                            <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                            {row.difference} (Perda)
                          </Badge>
                        )}
                      </TableCell>

                      {/* Observação opcional */}
                      <TableCell>
                        <Input
                          placeholder="Obs (opcional)..."
                          className="h-8 text-xs bg-background"
                          value={row.notes}
                          onChange={(e) => handleNotesChange(row.item.id, e.target.value)}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t text-sm">
              <span className="text-muted-foreground text-xs">
                Mostrando {(page - 1) * pageSize + 1} a{' '}
                {Math.min(page * pageSize, filteredRows.length)} de {filteredRows.length} itens
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 px-2"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                </Button>
                <span className="text-xs font-medium px-2">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-8 px-2"
                >
                  Próxima <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
