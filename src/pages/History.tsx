import { useState } from 'react'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'
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

export default function History() {
  const { movements } = useInventoryStore()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('TODOS')
  const [editingMovement, setEditingMovement] = useState<any | null>(null)

  const filteredMovements = movements.filter((m) => {
    const itemName = m.items
      ? formatItemDisplay({ name: m.items.name, id: m.item_id }).toLowerCase()
      : ''
    const respName = m.profiles?.full_name?.toLowerCase() || m.profiles?.email?.toLowerCase() || ''
    const matchSearch =
      itemName.includes(search.toLowerCase()) || respName.includes(search.toLowerCase())
    const matchType = filterType === 'TODOS' || m.type === filterType
    return matchSearch && matchType
  })

  const handleExport = () => {
    toast({
      title: 'Download Iniciado',
      description: 'O relatório histórico está sendo gerado em PDF.',
    })
  }

  const formatBatchDate = (dateStr: string) => {
    const parts = dateStr.split('-')
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
    return dateStr
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
        <Button onClick={handleExport} variant="outline" className="bg-background">
          <Download className="mr-2 h-4 w-4" strokeWidth={1.5} /> Exportar Relatório
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
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
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todas as Operações</SelectItem>
                <SelectItem value="IN">Apenas Entradas</SelectItem>
                <SelectItem value="OUT">Apenas Saídas</SelectItem>
                <SelectItem value="SPECIAL_OUT">Saídas Especiais</SelectItem>
              </SelectContent>
            </Select>
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
              {filteredMovements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMovements.map((m) => {
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
