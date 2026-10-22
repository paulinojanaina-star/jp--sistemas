import { useState, useMemo, useRef, useEffect } from 'react'
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
  Search,
  Filter,
  ArrowDownAZ,
  ArrowDown01,
  ListOrdered,
  X,
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
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'pending' | 'all'>('pending')
  const [sortOrder, setSortOrder] = useState<'alpha' | 'pending_desc'>('alpha')
  const [showNavDrawer, setShowNavDrawer] = useState(false)

  // Refs for auto-focusing next pending item and scrolling to items
  const itemRowRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const quantityInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  // Reset filters to default state whenever modal opens or order changes
  useEffect(() => {
    if (open) {
      setSearchTerm('')
      setStatusFilter('pending')
      setSortOrder('alpha')
      setShowNavDrawer(false)
    }
  }, [open, order?.id])

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

  // Progress metrics: items that have been fully received (in DB or completed via current receipt)
  const progressMetrics = useMemo(() => {
    const totalItems = fields.length
    if (totalItems === 0) {
      return { totalItems: 0, receivedItems: 0, pendingItems: 0, percentage: 0 }
    }

    let fullyReceivedCount = 0
    let pendingCount = 0

    watchedRows.forEach((row) => {
      const pending = Number(row?.pending_quantity) || 0
      const recNow = Number(row?.quantity_received_now) || 0
      if (pending <= 0 || (recNow > 0 && recNow >= pending)) {
        fullyReceivedCount++
      } else {
        pendingCount++
      }
    })

    const percentage = Math.round((fullyReceivedCount / totalItems) * 100)

    return {
      totalItems,
      receivedItems: fullyReceivedCount,
      pendingItems: pendingCount,
      percentage,
    }
  }, [fields.length, watchedRows])

  // Filter and sort items while preserving their real original indices in react-hook-form
  const filteredAndSortedItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return fields
      .map((field, originalIndex) => {
        const row = watchedRows[originalIndex] || field
        const pending = Number(row.pending_quantity) || 0
        const name = (row.item_name || '').toString()
        const isPending = pending > 0

        return {
          field,
          originalIndex,
          row,
          pending,
          name,
          isPending,
        }
      })
      .filter((item) => {
        // Status filter: pending only or all
        if (statusFilter === 'pending' && !item.isPending) {
          return false
        }
        // Search term filter
        if (term) {
          const matchName = item.name.toLowerCase().includes(term)
          const matchBatch = (item.row.batch_number || '').toLowerCase().includes(term)
          if (!matchName && !matchBatch) return false
        }
        return true
      })
      .sort((a, b) => {
        if (sortOrder === 'alpha') {
          return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
        }
        if (sortOrder === 'pending_desc') {
          if (b.pending !== a.pending) {
            return b.pending - a.pending
          }
          return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
        }
        return 0
      })
  }, [fields, watchedRows, searchTerm, statusFilter, sortOrder])

  // Helper to scroll directly to an item
  const handleScrollToItem = (itemKey: string) => {
    const el = itemRowRefs.current[itemKey]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-primary', 'transition-all')
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-primary')
      }, 1500)
    }
  }

  // Focus next pending item handler
  const handleFocusNextPending = (currentDisplayIndex: number) => {
    // Find next pending item in visible list first, otherwise anywhere in list
    for (let i = currentDisplayIndex + 1; i < filteredAndSortedItems.length; i++) {
      const target = filteredAndSortedItems[i]
      if (target.isPending) {
        const key = target.field.id
        const inputEl = quantityInputRefs.current[key]
        if (inputEl) {
          inputEl.focus()
          inputEl.select()
          handleScrollToItem(key)
          return
        }
      }
    }
  }

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
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
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

        {/* 6. Indicador de Progresso Geral */}
        <div className="p-3 rounded-xl border bg-card/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <PackageCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Progresso do Pedido:
              <strong className="text-emerald-600 dark:text-emerald-400">
                Recebido {progressMetrics.receivedItems} de {progressMetrics.totalItems} itens
              </strong>
            </span>
            <span className="font-mono font-bold text-xs text-muted-foreground">
              {progressMetrics.percentage}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressMetrics.percentage}%` }}
            />
          </div>
        </div>

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

          <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground flex-wrap gap-2">
            <span>
              Total no pedido: <strong>{fields.length} itens</strong>
              {progressMetrics.pendingItems > 0 && (
                <span className="ml-1 text-amber-600 dark:text-amber-400 font-medium">
                  ({progressMetrics.pendingItems} pendente
                  {progressMetrics.pendingItems > 1 ? 's' : ''})
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReceiveAll}
                className="h-6 text-[11px] text-primary px-2"
                title="Preenche a quantidade de todos os itens pendentes do pedido"
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

        {/* 1, 2, 3 e 4: Controles de Busca, Filtro, Ordenação e Barra de Navegação Rápida */}
        <div className="space-y-2.5 p-3 rounded-xl border bg-card shadow-sm">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* 1. Busca dentro do modal */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar item pelo nome ou lote..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-8 h-9 text-xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* 2. Filtro Rápido Pendentes / Todos */}
            <div className="flex items-center rounded-lg border p-0.5 bg-muted/40 shrink-0">
              <Button
                type="button"
                size="sm"
                variant={statusFilter === 'pending' ? 'default' : 'ghost'}
                onClick={() => setStatusFilter('pending')}
                className="h-7 text-xs px-2.5 font-semibold"
              >
                <Filter className="h-3 w-3 mr-1" />
                Pendentes ({progressMetrics.pendingItems})
              </Button>
              <Button
                type="button"
                size="sm"
                variant={statusFilter === 'all' ? 'default' : 'ghost'}
                onClick={() => setStatusFilter('all')}
                className="h-7 text-xs px-2.5 font-semibold"
              >
                Todos ({fields.length})
              </Button>
            </div>

            {/* 3. Ordenação alfabética ou quantidade pendente */}
            <div className="flex items-center rounded-lg border p-0.5 bg-muted/40 shrink-0">
              <Button
                type="button"
                size="sm"
                variant={sortOrder === 'alpha' ? 'default' : 'ghost'}
                onClick={() => setSortOrder('alpha')}
                title="Ordenar alfabeticamente por nome"
                className="h-7 text-xs px-2 font-medium"
              >
                <ArrowDownAZ className="h-3.5 w-3.5 mr-1" />
                Nome (A-Z)
              </Button>
              <Button
                type="button"
                size="sm"
                variant={sortOrder === 'pending_desc' ? 'default' : 'ghost'}
                onClick={() => setSortOrder('pending_desc')}
                title="Ordenar por maior quantidade pendente primeiro"
                className="h-7 text-xs px-2 font-medium"
              >
                <ArrowDown01 className="h-3.5 w-3.5 mr-1" />
                Maior Pendência
              </Button>
            </div>

            {/* 4. Botão Alternador do Painel Lateral de Navegação (para pedidos com muitos itens) */}
            <Button
              type="button"
              variant={showNavDrawer ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowNavDrawer((prev) => !prev)}
              className="h-8 text-xs shrink-0 font-medium"
              title="Abre atalhos diretos para rolar até cada item"
            >
              <ListOrdered className="h-3.5 w-3.5 mr-1 text-primary" />
              Navegar Itens ({filteredAndSortedItems.length})
            </Button>
          </div>

          {/* 4. Barra/Painel de navegação rápida com rolagem direta até a linha do item */}
          {showNavDrawer && (
            <div className="p-2.5 rounded-lg border bg-muted/20 space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <ListOrdered className="h-3 w-3" /> Atalhos de navegação rápida (clique para rolar
                  até o item)
                </span>
                <span>{filteredAndSortedItems.length} itens listados</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 border rounded bg-background/50">
                {filteredAndSortedItems.length === 0 ? (
                  <span className="text-xs text-muted-foreground p-1">
                    Nenhum item encontrado no filtro.
                  </span>
                ) : (
                  filteredAndSortedItems.map((item, idx) => {
                    const row = watchedRows[item.originalIndex] || item.field
                    const isFullyRec = (Number(row.pending_quantity) || 0) <= 0
                    const key = item.field.id

                    return (
                      <Button
                        key={`nav-${key}`}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleScrollToItem(key)}
                        className="h-6 text-[11px] px-2 py-0 max-w-[200px] truncate justify-between font-normal hover:border-primary"
                        title={item.name}
                      >
                        <span className="truncate">
                          {idx + 1}. {item.name}
                        </span>
                        {isFullyRec ? (
                          <span className="ml-1 text-emerald-500 font-bold shrink-0">✓</span>
                        ) : (
                          <span className="ml-1 text-amber-500 font-mono text-[10px] shrink-0 font-bold">
                            {row.pending_quantity}
                          </span>
                        )}
                      </Button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 pt-1">
            {/* Lista de Itens a Receber */}
            <div className="space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>
                  Itens a Receber ({filteredAndSortedItems.length} exibidos de {fields.length})
                </span>
                <span className="text-[10px] font-normal lowercase text-muted-foreground">
                  (Enter ou Tab avança automaticamente para o próximo item pendente)
                </span>
              </div>

              {filteredAndSortedItems.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed bg-muted/20 space-y-2">
                  <PackageCheck className="h-8 w-8 mx-auto text-muted-foreground/60" />
                  <p className="text-sm font-semibold text-foreground">
                    Nenhum item corresponde aos filtros
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {searchTerm
                      ? `Nenhum resultado para "${searchTerm}". Tente limpar a busca.`
                      : 'Todos os itens deste pedido já foram totalmente recebidos.'}
                  </p>
                  <div className="pt-2 flex justify-center gap-2">
                    {searchTerm && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchTerm('')}
                        className="text-xs"
                      >
                        Limpar Busca
                      </Button>
                    )}
                    {statusFilter === 'pending' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setStatusFilter('all')}
                        className="text-xs"
                      >
                        Ver Todos os Itens
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAndSortedItems.map((item, displayIndex) => {
                    const originalIndex = item.originalIndex
                    const itemField = item.field
                    const itemRow = (watchedRows[originalIndex] as any) || {}
                    const pending = Number(itemRow.pending_quantity) || 0
                    const receivedNow = Number(itemRow.quantity_received_now) || 0
                    const unitPrice = Number(itemRow.unit_price) || 0
                    const lineTotal = receivedNow * unitPrice
                    const unitLabel = itemRow.unit_type || 'un'
                    const isItemFullyReceived = pending <= 0

                    return (
                      <div
                        key={itemField.id}
                        ref={(el) => {
                          itemRowRefs.current[itemField.id] = el
                        }}
                        className={`p-3.5 rounded-xl border bg-card shadow-sm space-y-3 transition-colors ${
                          isItemFullyReceived
                            ? 'border-border/50 bg-muted/10 opacity-80'
                            : 'border-border/80'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b pb-2">
                          <div>
                            <div className="font-bold text-sm text-foreground flex items-center gap-2">
                              <span>
                                {displayIndex + 1}. {itemRow.item_name || 'Item'}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
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
                              <span
                                className={
                                  isItemFullyReceived
                                    ? 'text-muted-foreground'
                                    : 'text-amber-600 dark:text-amber-400 font-bold'
                                }
                              >
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
                            <div className="flex items-center gap-1.5 self-start sm:self-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  form.setValue(
                                    `items.${originalIndex}.quantity_received_now`,
                                    pending,
                                  )
                                }
                                className="h-6 text-[11px] text-primary px-1.5 font-semibold"
                              >
                                Receber Pendente ({pending})
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Campos do Item */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Qtd Recebida Agora com Auto-Foco */}
                          <FormField
                            control={form.control}
                            name={`items.${originalIndex}.quantity_received_now`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-bold flex items-center justify-between">
                                  <span>Qtd. Recebida Nesta Entrega ({unitLabel})</span>
                                  {!isItemFullyReceived && (
                                    <span className="text-[10px] text-muted-foreground font-normal">
                                      Pressione Enter p/ próximo
                                    </span>
                                  )}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    ref={(el) => {
                                      quantityInputRefs.current[itemField.id] = el
                                    }}
                                    type="number"
                                    min="0"
                                    max={pending}
                                    step="any"
                                    disabled={isItemFullyReceived}
                                    placeholder="0"
                                    className="font-mono text-sm font-bold h-9"
                                    {...field}
                                    value={field.value ?? 0}
                                    onKeyDown={(e) => {
                                      // 5. Foco automático ao teclar Enter
                                      if (e.key === 'Enter') {
                                        e.preventDefault()
                                        handleFocusNextPending(displayIndex)
                                      }
                                    }}
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
                            name={`items.${originalIndex}.unit_price`}
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
                            name={`items.${originalIndex}.batch_number`}
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
                            name={`items.${originalIndex}.expiry_date`}
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
              )}

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
