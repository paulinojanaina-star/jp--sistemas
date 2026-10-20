import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertCircle,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  FileCheck,
  Info,
  Loader2,
  Save,
  ShieldAlert,
} from 'lucide-react'
import { CountItemRow } from './InventoryCountStep'
import { formatItemDisplay } from '@/utils/itemFormat'

interface InventoryReviewStepProps {
  healthUnit: string
  items: CountItemRow[]
  onBack: () => void
  onConfirmSave: (justification: string) => Promise<void>
  isSaving: boolean
}

export function InventoryReviewStep({
  healthUnit,
  items,
  onBack,
  onConfirmSave,
  isSaving,
}: InventoryReviewStepProps) {
  const [justification, setJustification] = useState('')
  const [justificationError, setJustificationError] = useState('')

  const totalChecked = items.length
  const divergentItems = items.filter((it) => it.difference !== 0)
  const positiveItems = divergentItems.filter((it) => it.difference > 0)
  const negativeItems = divergentItems.filter((it) => it.difference < 0)
  const exactItems = items.filter((it) => it.difference === 0)

  const totalPositiveQty = positiveItems.reduce((acc, it) => acc + it.difference, 0)
  const totalNegativeQty = negativeItems.reduce((acc, it) => acc + Math.abs(it.difference), 0)

  const handleSave = async () => {
    if (!justification.trim() || justification.trim().length < 5) {
      setJustificationError(
        'Informe uma justificativa geral para esta contagem (mínimo de 5 caracteres), ex.: "Inventário mensal - Equipe Almoxarifado Central".',
      )
      return
    }
    setJustificationError('')
    await onConfirmSave(justification.trim())
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Passo de Revisão */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 via-primary/5 to-transparent border border-primary/20">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary text-primary-foreground font-semibold">
              Passo 2 de 2: Revisão
            </Badge>
            <span className="text-xs text-muted-foreground">Unidade: {healthUnit}</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight mt-1">
            Resumo & Confirmação da Contagem Manual
          </h3>
          <p className="text-xs text-muted-foreground">
            Verifique todos os itens conferidos e as divergências encontradas antes de salvar a
            sessão e atualizar os saldos do estoque.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onBack} disabled={isSaving}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar à Contagem
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md min-w-[170px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Aplicando Ajustes...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Confirmar e Gravar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Cards de Métricas da Revisão */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <FileCheck className="h-4 w-4 text-primary" /> Total Conferidos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-extrabold text-foreground">{totalChecked}</div>
            <p className="text-xs text-muted-foreground mt-0.5">itens contados nesta sessão</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-600" /> Divergências Totais
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {divergentItems.length}
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-0.5">
              {exactItems.length} sem alteração de saldo
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <ArrowUpRight className="h-4 w-4 text-emerald-600" /> Ajustes Positivos (+ Sobras)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              +{totalPositiveQty}
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400/80 mt-0.5">
              em {positiveItems.length} item(ns) — geram Entrada de Ajuste
            </p>
          </CardContent>
        </Card>

        <Card className="border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
              <ArrowDownRight className="h-4 w-4 text-rose-600" /> Ajustes Negativos (- Perdas)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              -{totalNegativeQty}
            </div>
            <p className="text-xs text-rose-700 dark:text-rose-400/80 mt-0.5">
              em {negativeItems.length} item(ns) — classificados como Perda (fora do consumo médio)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Regra de Negócio */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 text-xs leading-relaxed">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold block mb-0.5">Regras de negócio aplicadas:</strong>
          <ul className="list-disc list-inside space-y-0.5 text-blue-800 dark:text-blue-300">
            <li>
              <strong>Itens sem divergência:</strong> marcados apenas como conferidos na sessão, sem
              gerar movimentações adicionais.
            </li>
            <li>
              <strong>Faltas (contagem menor que o sistema):</strong> gravadas como Saída por Perda
              de Inventário (<code>INVENTORY_ADJUST_OUT</code>). Corrigem o saldo imediatamente e
              <strong> não afetam</strong> a média de consumo de 90 dias nem as sugestões de compra.
            </li>
            <li>
              <strong>Sobras (contagem maior que o sistema):</strong> gravadas como Entrada por
              Ajuste de Inventário (<code>INVENTORY_ADJUST_IN</code>).
            </li>
            <li>A gravação é completa e auditável no Histórico de Movimentações.</li>
          </ul>
        </div>
      </div>

      {/* Justificativa Geral da Contagem */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" /> Justificativa Geral do Inventário *
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="audit-justification" className="text-xs text-muted-foreground">
            Descreva o motivo desta conferência manual (ex.: Inventário de rotina mensal, auditoria
            geral, balanço semestral, equipe responsável).
          </Label>
          <Textarea
            id="audit-justification"
            placeholder="Ex.: Inventário periódico mensal - Conferência realizada pela equipe do Almoxarifado Central com base na contagem física das prateleiras."
            value={justification}
            onChange={(e) => {
              setJustification(e.target.value)
              if (justificationError) setJustificationError('')
            }}
            className={`min-h-[90px] ${justificationError ? 'border-destructive ring-1 ring-destructive' : ''}`}
          />
          {justificationError && (
            <p className="text-xs text-destructive font-medium">{justificationError}</p>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Itens com Divergência */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center justify-between">
            <span>Itens com Divergência a Ajustar ({divergentItems.length})</span>
            {divergentItems.length === 0 && (
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-emerald-300"
              >
                Todos os itens conferidos estão 100% alinhados com o sistema
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Saldo Atual (Sistema)</TableHead>
                <TableHead className="text-center">Quantidade Contada</TableHead>
                <TableHead className="text-center">Ajuste Aplicado</TableHead>
                <TableHead className="text-right">Novo Saldo Final</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {divergentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhuma divergência encontrada. Todos os {totalChecked} itens conferidos mantêm
                    o saldo atual.
                  </TableCell>
                </TableRow>
              ) : (
                divergentItems.map((row) => {
                  const isPositive = row.difference > 0
                  return (
                    <TableRow key={row.item.id}>
                      <TableCell>
                        <div className="font-semibold text-foreground">
                          {formatItemDisplay(row.item)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {row.item.unit_type || 'Unidade'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {row.systemQuantity}
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold">
                        {row.countedQuantity}
                      </TableCell>
                      <TableCell className="text-center">
                        {isPositive ? (
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-mono font-bold">
                            <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />+{row.difference}{' '}
                            (Entrada / Sobra)
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-600 hover:bg-rose-700 text-white font-mono font-bold">
                            <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                            {row.difference} (Perda / Falta)
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono font-extrabold text-foreground">
                        {row.countedQuantity}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.notes || '-'}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Itens Conferidos sem Divergência (Accordion resumido) */}
      {exactItems.length > 0 && (
        <Card className="border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Itens Conferidos Sem
                Divergência ({exactItems.length})
              </span>
              <span className="text-xs font-normal">Nenhuma movimentação gerada</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="max-h-48 overflow-y-auto divide-y text-xs">
              {exactItems.map((row) => (
                <div key={row.item.id} className="py-2 flex items-center justify-between">
                  <span className="font-medium text-foreground">{formatItemDisplay(row.item)}</span>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>
                      Saldo conferido:{' '}
                      <strong className="text-foreground">{row.countedQuantity}</strong>
                    </span>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                      OK
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões de Ação Final */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onBack} disabled={isSaving}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar à Lista de Contagem
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md min-w-[200px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Aplicando Ajustes...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Confirmar e Gravar Inventário
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
