import { useState, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { PurchaseOrder, RegisterReceiptInput } from '@/types/purchaseOrder'
import { formatItemDisplay } from '@/utils/itemFormat'
import {
  Loader2,
  ArrowDownToLine,
  AlertCircle,
  Calendar,
  Hash,
  PackageCheck,
  DollarSign,
  Calculator,
  CheckCircle2,
  Clock,
} from 'lucide-react'

interface RegisterReceiptModalProps {
  order: PurchaseOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (receipt: RegisterReceiptInput) => Promise<boolean>
}

// Per-item receipt schema
const receiptItemRowSchema = z.object({
  order_item_id: z.string(),
  item_id: z.string(),
  item_name: z.string().optional(),
  unit_type: z.string().optional(),
  quantity_ordered: z.number(),
  quantity_received: z.number(),
  pending_quantity: z.number(),
  quantity_received_now: z.coerce.number().min(0, 'Quantidade não pode ser negativa'),
  unit_price: z.coerce.number().min(0, 'Valor não pode ser negativo').optional(),
  batch_number: z.string().optional(),
  expiry_date: z.string().optional(),
})

const receiptFormSchema = z.object({
  received_at: z.string().min(1, 'Informe a data de recebimento'),
  health_unit_name: z.string().min(1, 'Unidade de destino obrigatória').trim(),
  observations: z.string().optional(),
  items: z
    .array(receiptItemRowSchema)
    .refine((rows) => rows.some((r) => (Number(r.quantity_received_now) || 0) > 0), {
      message: 'Informe a quantidade recebida de pelo menos 1 item.',
      path: ['items'],
    }),
})

type ReceiptFormValues = z.infer<typeof receiptFormSchema>

export function RegisterReceiptModal({
  order,
  open,
  onOpenChange,
  onSubmit,
}: RegisterReceiptModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  // Build the list of order items (either from order_items array or fallback from legacy single item)
  const normalizedOrderItems = useMemo(() => {
    if (!order) return []

    if (order.order_items && order.order_items.length > 0) {
      return order.order_items.map((poi) => {
        const ordered = Number(poi.quantity_ordered) || 0
        const received = Number(poi.quantity_received) || 0
        const pending = Math.max(0, ordered - received)
        return {
          order_item_id: poi.id,
          item_id: poi.item_id,
          item_name: poi.item ? formatItemDisplay(poi.item) : 'Item',
          unit_type: poi.item?.unit_type || 'un',
          quantity_ordered: ordered,
          quantity_received: received,
          pending_quantity: pending,
          quantity_received_now: pending, // default to receive full pending
          unit_price:
            poi.unit_price > 0
              ? poi.unit_price
              : poi.item?.unit_price
                ? Number(poi.item.unit_price)
                : 0,
          batch_number: '',
          expiry_date: '',
        }
      })
    }

    // Legacy fallback
    const ordered = Number(order.quantity_ordered) || 0
    const received = Number(order.quantity_received) || 0
    const pending = Math.max(0, ordered - received)
    const price = order.unit_price
      ? Number(order.unit_price)
      : order.item?.unit_price
        ? Number(order.item.unit_price)
        : 0

    return [
      {
        order_item_id: '',
        item_id: order.item_id || '',
        item_name: order.item ? formatItemDisplay(order.item) : 'Item selecionado',
        unit_type: order.item?.unit_type || 'un',
        quantity_ordered: ordered,
        quantity_received: received,
        pending_quantity: pending,
        quantity_received_now: pending,
        unit_price: price,
        batch_number: '',
        expiry_date: '',
      },
    ]
  }, [order])

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptFormSchema) as any,
    values: {
      received_at: todayStr,
      health_unit_name: order?.health_unit_name || 'Almoxarifado Central',
      observations: '',
      items: normalizedOrderItems,
    },
    resetOptions: {
      keepDefaultValues: false,
    },
  })

  const { fields } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  const watchedRows = form.watch('items') || []

  // Dynamic calculations for the delivery
  const { totalDeliveryValue, totalDeliveryUnits, willCompleteOrder, hasAnyPendingLeft } =
    useMemo(() => {
      let deliveryVal = 0
      let deliveryUnits = 0
      let allCompleted = true
      let anyReceived = false

      watchedRows.forEach((row) => {
        const pending = Number(row?.pending_quantity) || 0
        const recNow = Number(row?.quantity_received_now) || 0
        const price = Number(row?.unit_price) || 0

        deliveryUnits += recNow
        deliveryVal += recNow * price

        if (recNow > 0) anyReceived = true
        if (recNow < pending) allCompleted = false
      })

      return {
        totalDeliveryValue: deliveryVal,
        totalDeliveryUnits: deliveryUnits,
        willCompleteOrder: allCompleted && anyReceived,
        hasAnyPendingLeft: !allCompleted,
      }
    }, [watchedRows])

  if (!order) return null

  // Helper to receive all pending items
  const handleReceiveAll = () => {
    normalizedOrderItems.forEach((it, idx) => {
      form.setValue(`items.${idx}.quantity_received_now`, it.pending_quantity)
    })
  }

  // Helper to clear received now
  const handleClearAll = () => {
    normalizedOrderItems.forEach((_, idx) => {
      form.setValue(`items.${idx}.quantity_received_now`, 0)
    })
  }

  const handleFormSubmit = async (values: ReceiptFormValues) => {
    setSubmitting(true)

    const itemsPayload = values.items
      .filter((r) => Number(r.quantity_received_now) > 0)
      .map((r) => ({
        order_item_id: r.order_item_id,
        item_id: r.item_id,
        quantity_received_now: Number(r.quantity_received_now),
        unit_price: Number(r.unit_price) > 0 ? Number(r.unit_price) : undefined,
        batch_number: r.batch_number || null,
        expiry_date: r.expiry_date || null,
      }))

    const success = await onSubmit({
      order_id: order.id,
      received_at: values.received_at,
      health_unit_name: values.health_unit_name,
      observations: values.observations || null,
      items: itemsPayload,
    })

    setSubmitting(false)
    if (success) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowDownToLine className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black">
                Registrar Recebimento de Mercadorias
              </DialogTitle>
              <DialogDescription className="text-xs">
                Gera entradas no estoque físico e atualiza o saldo dos itens (suporta recebimento
                parcial por item).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Resumo Geral da Solicitação */}
        <div className="p-3.5 rounded-xl border bg-muted/30 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Solicitação / Processo
              </div>
              <div className="font-mono text-base font-black text-foreground">
                {order.request_number}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-bold">
                {order.status === 'PENDING' ? (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-amber-500" /> Pendente
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-blue-500" /> Parcial
                  </span>
                )}
              </Badge>
              {order.supplier && (
                <Badge variant="secondary" className="font-semibold text-xs">
                  {order.supplier}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
            <span>
              Total de itens: <strong>{fields.length}</strong>
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReceiveAll}
                className="h-6 text-[11px] text-primary px-2"
              >
                Receber Todos os Pendentes
              </Button>
              <span className="text-muted-foreground">•</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-6 text-[11px] text-muted-foreground px-2"
              >
                Zerar Campos
              </Button>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 pt-1">
            {/* Lista de Itens a Receber */}
            <div className="space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Itens a Receber ({fields.length})</span>
                <span className="text-[10px] font-normal lowercase">
                  (ajuste as quantidades conforme a nota de entrega)
                </span>
              </div>

              <div className="space-y-3">
                {fields.map((itemField, index) => {
                  const itemRow = (watchedRows[index] as any) || {}
                  const pending = Number(itemRow.pending_quantity) || 0
                  const receivedNow = Number(itemRow.quantity_received_now) || 0
                  const unitPrice = Number(itemRow.unit_price) || 0
                  const lineTotal = receivedNow * unitPrice
                  const unitLabel = itemRow.unit_type || 'un'
                  const isItemFullyReceived = pending <= 0

                  return (
                    <div
                      key={itemField.id}
                      className="p-3.5 rounded-xl border border-border/70 bg-card shadow-sm space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b pb-2">
                        <div>
                          <div className="font-bold text-sm text-foreground">
                            {index + 1}. {itemRow.item_name || 'Item'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                            <span>
                              Comprado:{' '}
                              <strong>
                                {itemRow.quantity_ordered ?? 0} {unitLabel}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Já Recebido:{' '}
                              <strong>
                                {itemRow.quantity_received ?? 0} {unitLabel}
                              </strong>
                            </span>
                            <span>•</span>
                            <span className="text-amber-600 dark:text-amber-400 font-bold">
                              Pendente: {pending} {unitLabel}
                            </span>
                          </div>
                        </div>

                        {isItemFullyReceived ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs font-bold self-start sm:self-center"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" /> 100% Concluído
                          </Badge>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              form.setValue(`items.${index}.quantity_received_now`, pending)
                            }
                            className="h-6 text-[11px] text-primary self-start sm:self-center px-1.5"
                          >
                            Receber Pendente ({pending})
                          </Button>
                        )}
                      </div>

                      {/* Campos do Item */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Qtd Recebida Agora */}
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity_received_now`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold">
                                Qtd. Recebida Nesta Entrega ({unitLabel})
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  max={pending}
                                  step="any"
                                  disabled={isItemFullyReceived}
                                  placeholder="0"
                                  className="font-mono text-sm font-bold h-9"
                                  {...field}
                                  value={field.value ?? 0}
                                  onChange={(e) => {
                                    const val =
                                      e.target.value === '' ? 0 : parseFloat(e.target.value)
                                    field.onChange(val)
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Valor Unitário Real da Nota */}
                        <FormField
                          control={form.control}
                          name={`items.${index}.unit_price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                  Valor Unit. Real (R$)
                                </span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0,00"
                                  disabled={isItemFullyReceived}
                                  className="font-mono text-sm font-bold h-9"
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={(e) => {
                                    const val =
                                      e.target.value === '' ? '' : parseFloat(e.target.value)
                                    field.onChange(val)
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Subtotal da Entrega */}
                        <div className="p-2 rounded-lg bg-muted/60 border flex flex-col justify-center h-9 text-right self-end">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">
                            Total da Entrega
                          </span>
                          <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(lineTotal)}
                          </span>
                        </div>
                      </div>

                      {/* Rastreabilidade por item: Lote e Validade */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t">
                        <FormField
                          control={form.control}
                          name={`items.${index}.batch_number`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[11px] font-semibold flex items-center gap-1 text-muted-foreground">
                                <Hash className="h-3 w-3" /> Lote do Item
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ex: LOT-2026A"
                                  disabled={isItemFullyReceived}
                                  className="text-xs font-mono h-8"
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.expiry_date`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[11px] font-semibold flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3 w-3" /> Validade do Lote
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  disabled={isItemFullyReceived}
                                  className="text-xs h-8"
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {form.formState.errors.items && (
                <p className="text-xs text-destructive font-semibold">
                  {form.formState.errors.items.message}
                </p>
              )}
            </div>

            {/* Totalizador desta Entrega e Status Resultante */}
            <div className="space-y-2">
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <span className="text-xs font-bold text-muted-foreground">
                      Total desta entrega:
                    </span>
                    <div className="text-[11px] text-muted-foreground">
                      {totalDeliveryUnits.toLocaleString('pt-BR')} unidades somadas
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      totalDeliveryValue,
                    )}
                  </div>
                </div>
              </div>

              <div className="text-xs px-3 py-2 rounded-lg bg-muted/60 border flex items-center justify-between">
                <span className="text-muted-foreground">Status resultante da solicitação:</span>
                {willCompleteOrder ? (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <PackageCheck className="h-4 w-4" /> ✅ Concluído (todos os itens 100%
                    recebidos)
                  </span>
                ) : hasAnyPendingLeft && totalDeliveryUnits > 0 ? (
                  <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> 🟡 Parcial (restarão itens/unidades
                    pendentes)
                  </span>
                ) : (
                  <span className="text-muted-foreground">Aguardando definição de quantidades</span>
                )}
              </div>
            </div>

            {/* Cabeçalho do Recebimento: Data, Unidade e Observações */}
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Data de Recebimento */}
                <FormField
                  control={form.control}
                  name="received_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> Data da Entrega
                      </FormLabel>
                      <FormControl>
                        <Input type="date" className="text-xs h-9" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Unidade de Destino */}
                <FormField
                  control={form.control}
                  name="health_unit_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Unidade de Destino</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: APS, Almoxarifado Central..."
                          className="text-xs h-9"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Observações da Entrega */}
              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">
                      Observações da Entrega (opcional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Nota fiscal nº, entregador, conformidade dos volumes..."
                        className="resize-none h-16 text-xs"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Ao confirmar, movimentações de <strong>ENTRADA</strong> serão geradas em{' '}
                <code>inventory_movements</code> para cada item recebido com lote/validade,
                atualizando automaticamente o saldo de estoque físico e o financeiro.
              </span>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Voltar
              </Button>
              <Button
                type="submit"
                disabled={submitting || totalDeliveryUnits <= 0}
                className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando Entradas...
                  </>
                ) : (
                  `Confirmar Entrada de ${totalDeliveryUnits.toLocaleString('pt-BR')} itens`
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
