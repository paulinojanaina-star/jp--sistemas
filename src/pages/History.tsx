import { useState } from 'react'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Download, ArrowDownToLine, ArrowUpFromLine, FileText } from 'lucide-react'
import { formatItemDisplay } from '@/utils/itemFormat'
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Histórico de Movimentações</h2>
          <p className="text-muted-foreground">
            Auditoria completa de entradas e saídas do banco de dados.
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" className="bg-white">
          <Download className="mr-2 h-4 w-4" /> Exportar Relatório
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                <TableHead>Responsável</TableHead>
                <TableHead>Unidade Origem/Destino</TableHead>
                <TableHead className="text-center">Anexo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMovements.map((m) => {
                  const isEntry = m.type === 'IN'

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
                          variant={isEntry ? 'outline' : 'default'}
                          className={`uppercase text-[10px] tracking-wider ${isEntry ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : ''}`}
                        >
                          <span className="flex items-center gap-1">
                            {isEntry ? (
                              <ArrowDownToLine size={12} />
                            ) : (
                              <ArrowUpFromLine size={12} />
                            )}
                            {isEntry ? 'ENTRADA' : 'SAÍDA'}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {m.items
                          ? formatItemDisplay({ name: m.items.name, id: m.item_id })
                          : 'Excluído'}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono font-bold ${isEntry ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'}`}
                      >
                        {isEntry ? '+' : '-'}
                        {m.quantity}
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
                              <FileText className="h-4 w-4 text-primary" />
                            </a>
                          </Button>
                        )}
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
