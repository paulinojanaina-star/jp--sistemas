import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
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
} from 'lucide-react'

interface RegisterReceiptModalProps {
  order: PurchaseOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (receipt: RegisterReceiptInput) => Promise<boolean>
}

export function RegisterReceiptModal({
  order,
  open,
  onOpenChange,
  onSubmit,
}: RegisterReceiptModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  const pendingQty = useMemo(() => {
    if (!order) return 0
    return Math.max(0, order.quantity_ordered - order.quantity_received)
  }, [order])

  const defaultUnitPrice = useMemo(() => {
    if (!order) return 0
    if (order.unit_price && Number(order.unit_price) > 0) return Number(order.unit_price)
    if (order.item?.unit_price && Number(order.item.unit_price) > 0)
      return Number(order.item.unit_price)
    return 0
  }, [order])

  const receiptSchema = useMemo(() => {
    return z.object({
      quantity_received_now: z.coerce
        .number()
        .positive('A quantidade deve ser maior que zero')
        .max(pendingQty, `A quantidade não pode exceder o pendente (${pendingQty})`),
      unit_price: z.coerce.number().min(0, 'Valor unitário não pode ser negativo').optional(),
      batch_number: z.string().optional(),
      expiry_date: z.string().optional(),
      received_at: z.string().min(1, 'Informe a data de recebimento'),
      health_unit_name: z.string().min(1, 'Unidade de destino obrigatória').trim(),
      observations: z.string().optional(),
    })
  }, [pendingQty])

  type ReceiptFormValues = z.infer<typeof receiptSchema>

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptSchema) as any,
    values: {
      quantity_received_now: pendingQty,
      unit_price: defaultUnitPrice,
      batch_number: '',
      expiry_date: '',
      received_at: todayStr,
      health_unit_name: order?.health_unit_name || 'Almoxarifado Central',
      observations: '',
    },
    resetOptions: {
      keepDefaultValues: false,
    },
  })

  if (!order) return null

  const watchedQty = Number(form.watch('quantity_received_now')) || 0
  const watchedPrice = Number(form.watch('unit_price')) || 0
  const deliveryTotal = watchedQty * watchedPrice
  const isPartial = watchedQty < pendingQty
  const willComplete = watchedQty >= pendingQty && pendingQty > 0

  const handleFormSubmit = async (values: ReceiptFormValues) => {
    setSubmitting(true)
    const price = Number(values.unit_price) || 0
    const success = await onSubmit({
      order_id: order.id,
      item_id: order.item_id,
      quantity_received_now: Number(values.quantity_received_now),
      unit_price: price > 0 ? price : undefined,
      batch_number: values.batch_number || null,
      expiry_date: values.expiry_date || null,
      received_at: values.received_at,
      health_unit_name: values.health_unit_name,
      observations: values.observations || null,
    })
    setSubmitting(false)
    if (success) {
      onOpenChange(false)
    }
  }

  const unitType = order.item?.unit_type || 'un'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowDownToLine className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black">Registrar Recebimento</DialogTitle>
              <DialogDescription className="text-xs">
                Gera entrada no estoque e atualiza o saldo do pedido (suporta recebimento parcial).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Resumo do Pedido */}
        <div className="p-4 rounded-xl border bg-muted/40 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Solicitação
              </div>
              <div className="font-mono text-base font-black text-foreground">
                {order.request_number}
              </div>
            </div>
            <Badge variant="outline" className="font-bold">
              {order.status === 'PENDING' ? '⏳ Pendente' : '🟡 Parcial'}
            </Badge>
          </div>

          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Item
            </div>
            <div className="text-sm font-semibold text-foreground">
              {order.item ? formatItemDisplay(order.item) : 'Item selecionado'}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center">
            <div className="bg-background/80 p-2 rounded-lg border">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                Comprado
              </span>
              <span className="text-base font-extrabold text-foreground">
                {order.quantity_ordered} {unitType}
              </span>
            </div>
            <div className="bg-background/80 p-2 rounded-lg border">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                Já Recebido
              </span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                {order.quantity_received} {unitType}
              </span>
            </div>
            <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/30">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase block">
                Pendente
              </span>
              <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                {pendingQty} {unitType}
              </span>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 pt-1">
            {/* Quantidade e Valor Unitário Real */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Quantidade Recebida Agora */}
              <FormField
                control={form.control}
                name="quantity_received_now"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="font-bold text-xs">
                        Qtd. Recebida Nesta Entrega
                      </FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-[11px] h-6 px-1.5 text-primary"
                        onClick={() => form.setValue('quantity_received_now', pendingQty)}
                      >
                        Tudo ({pendingQty})
                      </Button>
                    </div>
                    <FormControl>
                      <Input
                        type="number"
                        min="0.01"
                        max={pendingQty}
                        step="any"
                        placeholder="Ex: 50"
                        className="font-mono text-base font-bold"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Valor Unitário Real da Nota */}
              <FormField
                control={form.control}
                name="unit_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        Valor Unitário Real (R$)
                      </span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        Atualiza financeiro
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0,00"
                        className="font-mono text-base font-bold"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : parseFloat(e.target.value)
                          field.onChange(val)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Total desta entrega e status preview */}
            <div className="space-y-2">
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-muted-foreground">
                    Valor total desta entrega:
                  </span>
                </div>
                <div className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    deliveryTotal,
                  )}
                </div>
              </div>

              <div className="text-xs px-3 py-2 rounded-lg bg-muted/60 border flex items-center justify-between">
                <span className="text-muted-foreground">Status resultante do pedido:</span>
                {willComplete ? (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <PackageCheck className="h-4 w-4" /> ✅ Concluído (100% recebido)
                  </span>
                ) : isPartial && watchedQty > 0 ? (
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    🟡 Recebimento Parcial (restarão {pendingQty - watchedQty} {unitType})
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
            </div>

            {/* Lote e Validade */}
            <div className="p-3.5 rounded-xl border bg-muted/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Hash className="h-4 w-4 text-primary" />
                Rastreabilidade (Lote & Validade)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="batch_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Número do Lote</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: LOT-2026A"
                          className="text-sm font-mono"
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
                  name="expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Data de Validade</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="text-sm"
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
                      <Input type="date" className="text-sm" {...field} />
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
                        placeholder="Ex: APS, Almoxarifado..."
                        className="text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Observações */}
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
                      placeholder="Nota fiscal nº, entregador, conformidade da embalagem..."
                      className="resize-none h-16 text-xs"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Ao confirmar, uma movimentação de <strong>ENTRADA</strong> será gravada em{' '}
                <code>inventory_movements</code> e o saldo atual do item subirá automaticamente no
                sistema.
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
                disabled={submitting || pendingQty <= 0}
                className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  'Confirmar Entrada no Estoque'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
