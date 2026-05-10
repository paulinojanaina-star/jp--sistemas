import { useState, useEffect, useMemo } from 'react'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Download,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileText,
  CalendarIcon,
  Edit,
  AlertCircle,
  Table2,
} from 'lucide-react'
import { formatItemDisplay } from '@/utils/itemFormat'
import { EditMovementDialog } from '@/components/EditMovementDialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

export default function History() {
  const { movements } = useInventoryStore()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('TODOS')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [healthUnit, setHealthUnit] = useState<string>('TODAS')
  const [batch, setBatch] = useState<string>('TODOS')
  const [currentPage, setCurrentPage] = useState(1)

  const [editingMovement, setEditingMovement] = useState<any | null>(null)

  const uniqueHealthUnits = useMemo(() => {
    return Array.from(new Set(movements.map((m) => m.health_unit_name).filter(Boolean))).sort()
  }, [movements])

  const uniqueBatches = useMemo(() => {
    return Array.from(new Set(movements.map((m) => m.batch_number).filter(Boolean))).sort()
  }, [movements])

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const itemName = m.items
        ? formatItemDisplay({ name: m.items.name, id: m.item_id }).toLowerCase()
        : ''
      const respName =
        m.profiles?.full_name?.toLowerCase() || m.profiles?.email?.toLowerCase() || ''
      const matchSearch =
        itemName.includes(search.toLowerCase()) || respName.includes(search.toLowerCase())

      const matchType = filterType === 'TODOS' || m.type === filterType

      let matchDate = true
      if (dateFrom) {
        const from = new Date(dateFrom + 'T00:00:00')
        matchDate = matchDate && new Date(m.created_at) >= from
      }
      if (dateTo) {
        const to = new Date(dateTo + 'T23:59:59.999')
        matchDate = matchDate && new Date(m.created_at) <= to
      }

      const matchHealthUnit = healthUnit === 'TODAS' || m.health_unit_name === healthUnit
      const matchBatch = batch === 'TODOS' || m.batch_number === batch

      return matchSearch && matchType && matchDate && matchHealthUnit && matchBatch
    })
  }, [movements, search, filterType, dateFrom, dateTo, healthUnit, batch])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterType, dateFrom, dateTo, healthUnit, batch])

  const summary = useMemo(() => {
    return filteredMovements.reduce(
      (acc, m) => {
        if (m.type === 'IN') acc.in += m.quantity
        else if (m.type === 'OUT') acc.out += m.quantity
        else if (m.type === 'SPECIAL_OUT') acc.special += m.quantity
        return acc
      },
      { in: 0, out: 0, special: 0 },
    )
  }, [filteredMovements])

  const itemsPerPage = 15
  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / itemsPerPage))
  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  const formatBatchDate = (dateStr: string) => {
    const parts = dateStr.split('-')
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
    return dateStr
  }

  const handleExportCSV = () => {
    const headers = [
      'Data',
      'Tipo',
      'Item',
      'Quantidade',
      'Lote',
      'Fab',
      'Val',
      'Responsável',
      'Unidade Origem/Destino',
      'Motivo Especial',
      'Justificativa Edição',
    ]

    const rows = filteredMovements.map((m) => {
      const date = new Date(m.created_at).toLocaleString('pt-BR')
      const type =
        m.type === 'IN' ? 'ENTRADA' : m.type === 'SPECIAL_OUT' ? 'SAÍDA ESPECIAL' : 'SAÍDA'
      const item = m.items ? formatItemDisplay({ name: m.items.name, id: m.item_id }) : 'Excluído'
      const qty = m.quantity
      const batchNum = m.batch_number || ''
      const fab = m.manufacturing_date ? formatBatchDate(m.manufacturing_date) : ''
      const val = m.expiry_date ? formatBatchDate(m.expiry_date) : ''
      const resp = m.profiles?.full_name || m.profiles?.email || 'Desconhecido'
      const unit = m.health_unit_name || ''
      const reason = m.special_reason || ''
      const edit = m.edit_justification || ''

      return [date, type, item, qty, batchNum, fab, val, resp, unit, reason, edit]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    })

    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'historico_movimentacoes.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: 'Exportação Concluída',
      description: 'O arquivo CSV foi gerado com sucesso.',
    })
  }

  const handleExport = () => {
    toast({
      title: 'Download Iniciado',
      description: 'O relatório histórico está sendo gerado em PDF.',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-medium tracking-tight">Histórico de Movimentações</h2>
          <p className="text-muted-foreground">
            Auditoria completa de entradas e saídas do banco de dados.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" className="bg-background">
            <Table2 className="mr-2 h-4 w-4" strokeWidth={1.5} /> Exportar CSV
          </Button>
          <Button onClick={handleExport} variant="outline" className="bg-background">
            <Download className="mr-2 h-4 w-4" strokeWidth={1.5} /> Exportar PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              +{summary.in.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saídas Regulares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-{summary.out.toLocaleString('pt-BR')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saídas Especiais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              -{summary.special.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  strokeWidth={1.5}
                />
                <Input
                  placeholder="Filtrar por item ou responsável..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Tipo de Movimentação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todas as Operações</SelectItem>
                  <SelectItem value="IN">Apenas Entradas</SelectItem>
                  <SelectItem value="OUT">Apenas Saídas</SelectItem>
                  <SelectItem value="SPECIAL_OUT">Saídas Especiais</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-1 gap-2 items-center">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full"
                  title="Data Inicial"
                />
                <span className="text-muted-foreground text-sm">até</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full"
                  title="Data Final"
                />
              </div>
              <Select value={healthUnit} onValueChange={setHealthUnit}>
                <SelectTrigger className="w-full md:w-[240px]">
                  <SelectValue placeholder="Unidade de Saúde" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas as Unidades</SelectItem>
                  {uniqueHealthUnits.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={batch} onValueChange={setBatch}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Lote" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os Lotes</SelectItem>
                  {uniqueBatches.map((b) => (
                    <SelectItem key={b} value={b}>
                      Lote: {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead>Lote / Fab / Val</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Unidade Origem/Destino</TableHead>
                <TableHead className="text-center">Anexo</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMovements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    Nenhum registro encontrado para os filtros atuais.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMovements.map((m) => {
                  const isEntry = m.type === 'IN'
                  const isSpecial = m.type === 'SPECIAL_OUT'

                  return (
                    <TableRow key={m.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(m.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isEntry ? 'outline' : isSpecial ? 'secondary' : 'default'}
                          className={`uppercase text-[10px] tracking-wider font-semibold ${isEntry ? 'text-secondary border-secondary/30 bg-secondary/10' : isSpecial ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : ''}`}
                        >
                          <span className="flex items-center gap-1">
                            {isEntry ? (
                              <ArrowDownToLine size={12} strokeWidth={1.5} />
                            ) : isSpecial ? (
                              <AlertCircle size={12} strokeWidth={1.5} />
                            ) : (
                              <ArrowUpFromLine size={12} strokeWidth={1.5} />
                            )}
                            {isEntry ? 'ENTRADA' : isSpecial ? 'SAÍDA ESP.' : 'SAÍDA'}
                          </span>
                        </Badge>
                        {isSpecial && m.special_reason && (
                          <div className="text-[10px] text-muted-foreground mt-1 font-medium">
                            {m.special_reason}
                          </div>
                        )}
                        {m.edit_justification && (
                          <div
                            className="text-[10px] text-blue-500 mt-1 cursor-help"
                            title={`Justificativa: ${m.edit_justification}`}
                          >
                            *Editado
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {m.items
                          ? formatItemDisplay({ name: m.items.name, id: m.item_id })
                          : 'Excluído'}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono font-bold ${isEntry ? 'text-secondary' : 'text-foreground'}`}
                      >
                        {isEntry ? '+' : '-'}
                        {m.quantity}
                      </TableCell>
                      <TableCell className="text-sm">
                        {m.batch_number || m.manufacturing_date || m.expiry_date ? (
                          <div className="flex flex-col gap-0.5">
                            {m.batch_number && (
                              <span className="font-medium text-foreground">
                                Lote: {m.batch_number}
                              </span>
                            )}
                            {m.manufacturing_date && (
                              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                                <CalendarIcon className="h-3 w-3" strokeWidth={1.5} />
                                Fab: {formatBatchDate(m.manufacturing_date)}
                              </span>
                            )}
                            {m.expiry_date && (
                              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                                <CalendarIcon className="h-3 w-3" strokeWidth={1.5} />
                                Val: {formatBatchDate(m.expiry_date)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell
                        className="text-sm truncate max-w-[150px]"
                        title={m.profiles?.email}
                      >
                        {m.profiles?.full_name || m.profiles?.email || 'Desconhecido'}
                      </TableCell>
                      <TableCell
                        className="text-sm text-muted-foreground truncate max-w-[150px]"
                        title={m.health_unit_name}
                      >
                        {m.health_unit_name}
                      </TableCell>
                      <TableCell className="text-center">
                        {m.document_url && (
                          <Button variant="ghost" size="icon" asChild title="Ver Anexo">
                            <a href={m.document_url} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-4 w-4 text-primary" strokeWidth={1.5} />
                            </a>
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingMovement(m)}
                          title="Editar Registro"
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="p-4 border-t">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={
                        currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="text-sm px-4 text-muted-foreground">
                      Página {currentPage} de {totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={
                        currentPage === totalPages
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {editingMovement && (
        <EditMovementDialog
          movement={editingMovement}
          open={!!editingMovement}
          onOpenChange={(open) => !open && setEditingMovement(null)}
        />
      )}
    </div>
  )
}
