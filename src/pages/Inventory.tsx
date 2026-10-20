import { useState, useEffect, useMemo } from 'react'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ClipboardCheck,
  Building,
  RotateCcw,
  History as HistoryIcon,
  Eye,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Play,
  FileSpreadsheet,
} from 'lucide-react'
import { CountItemRow, InventoryCountStep } from '@/components/inventory/InventoryCountStep'
import { InventoryReviewStep } from '@/components/inventory/InventoryReviewStep'
import { AuditSessionDetailsModal } from '@/components/inventory/AuditSessionDetailsModal'
import { InventoryAuditSession, SaveInventoryAuditInput } from '@/types/inventoryAudit'
import { fetchInventoryAuditSessions, saveInventoryAudit } from '@/services/inventoryAudit'
import { ExportButtons } from '@/components/ExportButtons'
import { GenericExportOptions } from '@/utils/exportGeneric'

const DEFAULT_UNITS = [
  'APS',
  'Almoxarifado Central',
  'CEM',
  'CENTRAL DE VACINA',
  'Centro 2',
  'HOSPITAL BOM JESUS',
  'ODONTOLOGIA APS',
  'ODONTO PSF',
]

export default function Inventory() {
  const { items, movements, refreshData } = useInventoryStore()
  const { user } = useAuth()
  const { toast } = useToast()

  // Lista dinâmica de unidades a partir de movimentações existentes + defaults
  const healthUnits = useMemo(() => {
    const fromMovements = movements.map((m) => m.health_unit_name).filter(Boolean)
    const combined = Array.from(new Set([...DEFAULT_UNITS, ...fromMovements]))
    return combined.sort()
  }, [movements])

  const [selectedUnit, setSelectedUnit] = useState<string>('APS')
  const [activeTab, setActiveTab] = useState<'count' | 'history'>('count')

  // Fluxo de contagem: 'COUNTING' -> 'REVIEW'
  const [step, setStep] = useState<'COUNTING' | 'REVIEW'>('COUNTING')
  const [countedRows, setCountedRows] = useState<CountItemRow[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Histórico de auditorias salvas
  const [auditSessions, setAuditSessions] = useState<InventoryAuditSession[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [viewingSession, setViewingSession] = useState<InventoryAuditSession | null>(null)

  const loadAuditHistory = async () => {
    setLoadingHistory(true)
    const { data } = await fetchInventoryAuditSessions()
    setAuditSessions(data || [])
    setLoadingHistory(false)
  }

  useEffect(() => {
    loadAuditHistory()
  }, [])

  // Quando o usuário clica em "Revisar e Justificar"
  const handleGoToReview = (rows: CountItemRow[]) => {
    setCountedRows(rows)
    setStep('REVIEW')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackToCounting = () => {
    setStep('COUNTING')
  }

  // Ao confirmar na tela de revisão: salva a sessão e cria movimentações reais no Supabase
  const handleConfirmSave = async (justification: string) => {
    if (!user?.id) {
      toast({
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado para salvar o inventário.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const payload: SaveInventoryAuditInput = {
        healthUnitName: selectedUnit,
        responsibleId: user.id,
        justification,
        items: countedRows.map((r) => ({
          itemId: r.item.id,
          countedQuantity: r.countedQuantity,
          systemQuantity: r.systemQuantity,
          notes: r.notes,
        })),
      }

      const result = await saveInventoryAudit(payload)

      if (!result.success) {
        toast({
          title: 'Erro ao salvar inventário',
          description: result.error?.message || 'Falha ao gravar ajustes no banco de dados.',
          variant: 'destructive',
        })
        return
      }

      // Sucesso! Recarregar estoque e histórico
      await Promise.all([refreshData(), loadAuditHistory()])

      toast({
        title: 'Inventário Concluído com Sucesso!',
        description: `Sessão de contagem gravada. Divergências foram aplicadas no saldo e registradas no Histórico.`,
      })

      // Resetar para contagem limpa
      setStep('COUNTING')
      setCountedRows([])
      setActiveTab('history') // Leva o usuário para ver a sessão gravada
    } catch (err: any) {
      toast({
        title: 'Erro inesperado',
        description: err.message || 'Falha ao processar inventário.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-7 w-7 text-primary" />
            Ajuste de Inventário (Contagem Manual)
          </h2>
          <p className="text-muted-foreground text-sm">
            Conferência física de estoque por unidade de saúde com revisão e auditoria transacional.
          </p>
        </div>

        {/* Seletor da Unidade de Saúde */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Building className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex flex-col gap-1 w-full sm:w-[260px]">
            <Select
              value={selectedUnit}
              onValueChange={(val) => {
                if (step === 'REVIEW') {
                  if (!confirm('Alterar a unidade cancelará a revisão atual. Deseja continuar?')) {
                    return
                  }
                  setStep('COUNTING')
                }
                setSelectedUnit(val)
              }}
            >
              <SelectTrigger className="font-semibold bg-background">
                <SelectValue placeholder="Selecione a Unidade" />
              </SelectTrigger>
              <SelectContent>
                {healthUnits.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Abas: Nova Sessão vs Histórico de Sessões */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'count' | 'history')}
        className="w-full"
      >
        <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
          <TabsTrigger value="count" className="flex items-center gap-2">
            <Play className="h-4 w-4" /> Nova Sessão de Contagem
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <HistoryIcon className="h-4 w-4" /> Sessões Anteriores ({auditSessions.length})
          </TabsTrigger>
        </TabsList>

        {/* Aba 1: Sessão Ativa de Contagem */}
        <TabsContent value="count" className="mt-4 space-y-4">
          {step === 'COUNTING' && (
            <InventoryCountStep
              items={items}
              healthUnit={selectedUnit}
              onGoToReview={handleGoToReview}
            />
          )}

          {step === 'REVIEW' && (
            <InventoryReviewStep
              healthUnit={selectedUnit}
              items={countedRows}
              onBack={handleBackToCounting}
              onConfirmSave={handleConfirmSave}
              isSaving={isSaving}
            />
          )}
        </TabsContent>

        {/* Aba 2: Histórico de Auditorias de Inventário */}
        <TabsContent value="history" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  Sessões de Contagem Concluídas
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Registro auditável de todas as conferências manuais já realizadas no sistema.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadAuditHistory}
                  disabled={loadingHistory}
                  className="h-8 text-xs"
                >
                  <RotateCcw
                    className={`h-3.5 w-3.5 mr-1 ${loadingHistory ? 'animate-spin' : ''}`}
                  />
                  Atualizar
                </Button>
                <ExportButtons
                  disabled={auditSessions.length === 0}
                  options={(): GenericExportOptions<InventoryAuditSession> => ({
                    filename: 'sessoes-inventario',
                    title: 'Sessões de Contagem Concluídas (Inventário)',
                    subtitle: `Unidade: ${selectedUnit}`,
                    filters: [{ label: 'Unidade Selecionada', value: selectedUnit }],
                    data: auditSessions,
                    columns: [
                      {
                        header: 'Data / Hora',
                        accessor: (s) =>
                          new Date(s.created_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }),
                      },
                      { header: 'Unidade', key: 'health_unit_name' },
                      {
                        header: 'Responsável',
                        accessor: (s) => s.profiles?.full_name || s.profiles?.email || 'Usuário',
                      },
                      {
                        header: 'Itens Conferidos',
                        accessor: (s) => s.total_items_checked,
                        align: 'center',
                      },
                      {
                        header: 'Divergências',
                        accessor: (s) => `${s.divergent_items_count} divergente(s)`,
                        align: 'center',
                      },
                      {
                        header: 'Ajustes (+)',
                        accessor: (s) => s.positive_adjustments_count,
                        align: 'center',
                      },
                      {
                        header: 'Ajustes (-)',
                        accessor: (s) => s.negative_adjustments_count,
                        align: 'center',
                      },
                      {
                        header: 'Justificativa',
                        accessor: (s) => s.justification || '-',
                      },
                    ],
                  })}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Data / Hora</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-center">Itens Conferidos</TableHead>
                    <TableHead className="text-center">Divergências</TableHead>
                    <TableHead className="text-center">Ajustes (+ / -)</TableHead>
                    <TableHead>Justificativa</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditSessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                        Nenhuma sessão de inventário manual registrada ainda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditSessions.map((session) => (
                      <TableRow key={session.id} className="text-sm">
                        <TableCell className="whitespace-nowrap font-medium">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {new Date(session.created_at).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-semibold">
                            {session.health_unit_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {session.profiles?.full_name || session.profiles?.email || 'Usuário'}
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {session.total_items_checked}
                        </TableCell>
                        <TableCell className="text-center">
                          {session.divergent_items_count === 0 ? (
                            <Badge
                              variant="outline"
                              className="text-emerald-700 bg-emerald-50 text-xs"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Nenhuma
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500 text-white font-bold text-xs">
                              {session.divergent_items_count} divergente(s)
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs">
                          <span className="text-emerald-600 font-bold">
                            +{session.positive_adjustments_count}
                          </span>
                          {' / '}
                          <span className="text-rose-600 font-bold">
                            -{session.negative_adjustments_count}
                          </span>
                        </TableCell>
                        <TableCell
                          className="max-w-[250px] truncate text-xs text-muted-foreground"
                          title={session.justification}
                        >
                          {session.justification}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => setViewingSession(session)}
                            title="Ver detalhes da sessão"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1 text-primary" /> Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes da Sessão */}
      <AuditSessionDetailsModal
        session={viewingSession}
        open={!!viewingSession}
        onOpenChange={(open) => !open && setViewingSession(null)}
      />
    </div>
  )
}
