import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  User,
  Building,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react'
import { InventoryAuditSession, InventoryAuditSessionItem } from '@/types/inventoryAudit'
import { fetchInventoryAuditSessionDetails } from '@/services/inventoryAudit'
import { ExportButtons } from '@/components/ExportButtons'
import { GenericExportOptions } from '@/utils/exportGeneric'

interface AuditSessionDetailsModalProps {
  session: InventoryAuditSession | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuditSessionDetailsModal({
  session,
  open,
  onOpenChange,
}: AuditSessionDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<InventoryAuditSessionItem[]>([])

  useEffect(() => {
    if (!open || !session?.id) {
      setItems([])
      return
    }

    let isMounted = true
    async function load() {
      setLoading(true)
      const res = await fetchInventoryAuditSessionDetails(session!.id)
      if (isMounted) {
        setItems(res.items || [])
        setLoading(false)
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [open, session?.id])

  if (!session) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Auditoria de Inventário: {session.health_unit_name}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Realizado em {new Date(session.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
              {session.status === 'COMPLETED' ? 'Concluído' : session.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 flex-1 overflow-y-auto">
          {/* Informações da Sessão */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg border bg-muted/30 space-y-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <Building className="h-3.5 w-3.5" /> Unidade de Saúde
              </span>
              <p className="font-semibold text-foreground text-sm">{session.health_unit_name}</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30 space-y-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> Responsável
              </span>
              <p className="font-semibold text-foreground text-sm">
                {session.profiles?.full_name || session.profiles?.email || 'Usuário'}
              </p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30 space-y-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Data da Conferência
              </span>
              <p className="font-semibold text-foreground text-sm">
                {new Date(session.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-900 text-xs">
            <span className="text-muted-foreground font-medium block mb-1">
              Justificativa Registrada:
            </span>
            <p className="text-foreground italic">{session.justification}</p>
          </div>

          {/* Cards de Métricas */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <Card className="p-2">
              <CardContent className="p-1">
                <span className="text-[10px] text-muted-foreground">Total Itens</span>
                <p className="text-lg font-bold">{session.total_items_checked}</p>
              </CardContent>
            </Card>
            <Card className="p-2">
              <CardContent className="p-1">
                <span className="text-[10px] text-muted-foreground">Divergências</span>
                <p className="text-lg font-bold text-amber-600">{session.divergent_items_count}</p>
              </CardContent>
            </Card>
            <Card className="p-2">
              <CardContent className="p-1">
                <span className="text-[10px] text-muted-foreground">Ajustes Positivos</span>
                <p className="text-lg font-bold text-emerald-600">
                  +{session.positive_adjustments_count}
                </p>
              </CardContent>
            </Card>
            <Card className="p-2">
              <CardContent className="p-1">
                <span className="text-[10px] text-muted-foreground">
                  Ajustes Negativos (Perdas)
                </span>
                <p className="text-lg font-bold text-rose-600">
                  -{session.negative_adjustments_count}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Itens Conferidos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold">Itens Conferidos na Sessão</h4>
              <ExportButtons
                disabled={items.length === 0}
                options={(): GenericExportOptions<InventoryAuditSessionItem> => ({
                  filename: `sessao-inventario-${session.health_unit_name.toLowerCase().replace(/\s+/g, '-')}`,
                  title: `Itens Conferidos na Sessão de Inventário - ${session.health_unit_name}`,
                  subtitle: `Realizado em ${new Date(session.created_at).toLocaleString('pt-BR')} por ${session.profiles?.full_name || session.profiles?.email || 'Usuário'}`,
                  filters: [
                    { label: 'Unidade', value: session.health_unit_name },
                    { label: 'Total Conferidos', value: session.total_items_checked },
                    { label: 'Divergências', value: session.divergent_items_count },
                    { label: 'Justificativa', value: session.justification },
                  ],
                  data: items,
                  columns: [
                    {
                      header: 'Insumo / Material',
                      accessor: (it) => it.items?.name || 'Item',
                    },
                    {
                      header: 'Estoque Sistema',
                      accessor: (it) => it.system_quantity,
                      align: 'right',
                    },
                    {
                      header: 'Qtd. Auditada',
                      accessor: (it) => it.counted_quantity,
                      align: 'right',
                    },
                    {
                      header: 'Diferença',
                      accessor: (it) =>
                        it.difference > 0 ? `+${it.difference}` : `${it.difference}`,
                      align: 'right',
                    },
                    {
                      header: 'Observações',
                      accessor: (it) => it.notes || '-',
                    },
                  ],
                })}
              />
            </div>
            {loading ? (
              <div className="p-8 flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando itens da conferência...
              </div>
            ) : items.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                Nenhum detalhe de item encontrado para esta sessão.
              </p>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-xs">
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Sistema</TableHead>
                      <TableHead className="text-center">Contado</TableHead>
                      <TableHead className="text-center">Diferença</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((it) => {
                      const isPositive = it.difference > 0
                      const isNegative = it.difference < 0

                      return (
                        <TableRow key={it.id} className="text-xs">
                          <TableCell className="font-medium">{it.items?.name || 'Item'}</TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {it.system_quantity}
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold">
                            {it.counted_quantity}
                          </TableCell>
                          <TableCell className="text-center">
                            {it.difference === 0 ? (
                              <Badge
                                variant="outline"
                                className="text-emerald-700 bg-emerald-50 text-[10px]"
                              >
                                <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> OK
                              </Badge>
                            ) : isPositive ? (
                              <Badge className="bg-amber-500 text-white font-mono text-[10px]">
                                <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" /> +{it.difference}
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-600 text-white font-mono text-[10px]">
                                <ArrowDownRight className="h-2.5 w-2.5 mr-0.5" /> {it.difference}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{it.notes || '-'}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
