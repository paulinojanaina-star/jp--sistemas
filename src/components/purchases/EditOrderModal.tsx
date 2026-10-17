import { useState, useMemo, useEffect } from 'react'
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Item } from '@/types/inventory'
import { PurchaseOrder, UpdatePurchaseOrderInput } from '@/types/purchaseOrder'
import { formatItemDisplay } from '@/utils/itemFormat'
import { cn } from '@/lib/utils'
import {
  Check,
  ChevronsUpDown,
  Loader2,
  PlusCircle,
  Building2,
  Calculator,
  DollarSign,
  Trash2,
  Layers,
  Edit,
  AlertTriangle,
  Lock,
} from 'lucide-react'

const editOrderItemSchema = z
  .object({
    id: z.string().optional(),
    item_id: z.string().min(1, 'Selecione um item'),
    quantity_ordered: z.coerce.number().positive('Qtd deve ser > 0'),
    quantity_received: z.coerce.number().default(0),
    unit_price: z.coerce.number().min(0, 'Valor unitário não pode ser negativo').optional(),
  })
  .refine(
    (data) => {
      const rec = Number(data.quantity_received || 0)
      const ord = Number(data.quantity_ordered)
      return ord >= rec
    },
    {
      message: 'A quantidade comprada não pode ser menor que a quantidade já recebida deste item.',
      path: ['quantity_ordered'],
    },
  )

const editOrderSchema = z.object({
  request_number: z.string().min(1, 'Digite o número oficial da solicitação').trim(),
  supplier: z.string().optional(),
  health_unit_name: z.string().optional(),
  requested_at: z.string().min(1, 'Informe a data da solicitação'),
  expected_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(editOrderItemSchema).min(1, 'A solicitação precisa de pelo menos 1 item'),
})

type EditOrderFormValues = z.infer<typeof editOrderSchema>

interface EditOrderModalProps {
  order: PurchaseOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  items: Item[]
  existingUnits: string[]
  onSubmit: (values: UpdatePurchaseOrderInput) => Promise<boolean>
}

export function EditOrderModal({
  order,
  open,
  onOpenChange,
  items,
  existingUnits,
  onSubmit,
}: EditOrderModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [unitPopoverOpen, setUnitPopoverOpen] = useState(false)
  const [openItemPopoverIndex, setOpenItemPopoverIndex] = useState<number | null>(null)

  // Map of available catalog items for lookup
  const itemsMap = useMemo(() => {
    const map = new Map<string, Item>()
    items.forEach((item) => map.set(item.id, item))
    return map
  }, [items])

  const form = useForm<EditOrderFormValues>({
    resolver: zodResolver(editOrderSchema) as any,
    defaultValues: {
      request_number: '',
      supplier: '',
      health_unit_name: 'APS',
      requested_at: '',
      expected_date: '',
      notes: '',
      items: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  // Populate form values whenever the order changes
  useEffect(() => {
    if (!order) return

    let initialItems: any[] = []
    if (order.order_items && order.order_items.length > 0) {
      initialItems = order.order_items.map((poi) => ({
        id: poi.id,
        item_id: poi.item_id,
        quantity_ordered: Number(poi.quantity_ordered),
        quantity_received: Number(poi.quantity_received || 0),
        unit_price: Number(poi.unit_price || 0),
      }))
    } else if (order.item_id && order.quantity_ordered) {
      initialItems = [
        {
          item_id: order.item_id,
          quantity_ordered: Number(order.quantity_ordered),
          quantity_received: Number(order.quantity_received || 0),
          unit_price: Number(order.unit_price || 0),
        },
      ]
    } else {
      initialItems = [
        {
          item_id: '',
          quantity_ordered: 1,
          quantity_received: 0,
          unit_price: 0,
        },
      ]
    }

    form.reset({
      request_number: order.request_number || '',
      supplier: order.supplier || '',
      health_unit_name: order.health_unit_name || 'APS',
      requested_at: order.requested_at || '',
      expected_date: order.expected_date || '',
      notes: order.notes || '',
      items: initialItems,
    })
  }, [order, form])

  const watchedItems = form.watch('items') || []

  // Total invoice calculation in real time
  const { totalInvoiceValue, totalUnitsCount, totalReceivedUnits } = useMemo(() => {
    let total = 0
    let count = 0
    let received = 0
    watchedItems.forEach((row) => {
      const qty = Number(row?.quantity_ordered) || 0
      const rec = Number(row?.quantity_received) || 0
      const price = Number(row?.unit_price) || 0
      total += qty * price
      count += qty
      received += rec
    })
    return {
      totalInvoiceValue: total,
      totalUnitsCount: count,
      totalReceivedUnits: received,
    }
  }, [watchedItems])

  const handleSelectItemForIndex = (index: number, item: Item) => {
    form.setValue(`items.${index}.item_id`, item.id, { shouldValidate: true })

    // Auto-preenche o fornecedor se vazio
    const currentSupplier = form.getValues('supplier')
    if (!currentSupplier && item.supplier) {
      form.setValue('supplier', item.supplier)
    }

    // Se o valor unitário da linha estiver zerado, sugere o preço cadastrado do item
    const currentPrice = form.getValues(`items.${index}.unit_price`)
    if ((!currentPrice || currentPrice === 0) && item.unit_price && Number(item.unit_price) > 0) {
      form.setValue(`items.${index}.unit_price`, Number(item.unit_price), { shouldValidate: true })
    }

    setOpenItemPopoverIndex(null)
  }

  const handleFormSubmit = async (values: EditOrderFormValues) => {
    if (!order) return
    setSubmitting(true)

    const preparedItems = values.items.map((it) => {
      const price = Number(it.unit_price) || 0
      const qty = Number(it.quantity_ordered)
      return {
        id: it.id,
        item_id: it.item_id,
        quantity_ordered: qty,
        quantity_received: Number(it.quantity_received || 0),
        unit_price: price,
        total_price: price * qty,
      }
    })

    const success = await onSubmit({
      order_id: order.id,
      request_number: values.request_number,
      supplier: values.supplier || null,
      health_unit_name: values.health_unit_name || null,
      requested_at: values.requested_at,
      expected_date: values.expected_date || null,
      notes: values.notes || null,
      items: preparedItems,
    })

    setSubmitting(false)
    if (success) {
      onOpenChange(false)
    }
  }

  if (!order) return null

  const hasAnyReceiptsInOrder = totalReceivedUnits > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Edit className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black">Editar Solicitação de Compra</DialogTitle>
              <DialogDescription className="text-xs">
                Modifique os dados do cabeçalho, adicione, altere ou remova itens da solicitação nº{' '}
                <strong className="font-mono">{order.request_number}</strong>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Alerta explicativo de regra de negócio quando já existem recebimentos */}
        {hasAnyReceiptsInOrder && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-bold">Solicitação com recebimentos parciais registrados</p>
              <p className="mt-0.5 leading-relaxed text-[11px] opacity-90">
                Esta solicitação já possui <strong>{totalReceivedUnits} unidades recebidas</strong>{' '}
                no estoque. Para preservar a integridade das movimentações fiscais, itens já
                recebidos não podem ser excluídos nem trocados de produto, e a nova quantidade
                comprada não pode ser menor que a quantidade já recebida.
              </p>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 pt-1">
            {/* Cabeçalho: Dados Gerais da Solicitação */}
            <div className="p-4 rounded-2xl border bg-muted/20 space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Dados Gerais do Pedido
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Número da Solicitação */}
                <FormField
                  control={form.control}
                  name="request_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold flex items-center justify-between text-xs">
                        <span>Nº da Solicitação / Processo</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: SC-2026/045, PED-8891..."
                          className="font-mono text-sm font-semibold h-10"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fornecedor */}
                <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs">
                        Fornecedor / Distribuidora
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Distribuidora MedHospital..."
                          className="text-sm h-10"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Unidade de Saúde de Destino */}
                <FormField
                  control={form.control}
                  name="health_unit_name"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-1">
                      <FormLabel className="font-bold text-xs flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        Destino
                      </FormLabel>
                      <Popover open={unitPopoverOpen} onOpenChange={setUnitPopoverOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between font-normal text-left truncate h-10 text-xs"
                            >
                              <span className="truncate">
                                {field.value || 'Selecione a unidade...'}
                              </span>
                              <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-64" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar unidade..." />
                            <CommandList>
                              <CommandEmpty className="p-2 text-xs">
                                Pressione Enter para usar o texto digitado
                              </CommandEmpty>
                              <CommandGroup heading="Unidades Frequentes">
                                {existingUnits.map((unit) => (
                                  <CommandItem
                                    key={unit}
                                    value={unit}
                                    onSelect={(val) => {
                                      field.onChange(val)
                                      setUnitPopoverOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        field.value === unit ? 'opacity-100' : 'opacity-0',
                                      )}
                                    />
                                    {unit}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Data da Solicitação */}
                <FormField
                  control={form.control}
                  name="requested_at"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-1">
                      <FormLabel className="font-bold text-xs">Data da Solicitação</FormLabel>
                      <FormControl>
                        <Input type="date" className="h-10 text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Previsão de Entrega */}
                <FormField
                  control={form.control}
                  name="expected_date"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-1">
                      <FormLabel className="font-bold text-xs">
                        Previsão{' '}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          (opcional)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="h-10 text-xs"
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

            {/* Seção de Itens da Solicitação */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="text-sm font-black tracking-tight text-foreground">
                    Itens da Solicitação ({fields.length})
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      item_id: '',
                      quantity_ordered: 1,
                      quantity_received: 0,
                      unit_price: 0,
                    })
                  }
                  className="h-8 text-xs font-bold gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Adicionar Item
                </Button>
              </div>

              {/* Lista dinâmica de linhas de item */}
              <div className="space-y-3">
                {fields.map((fieldItem, index) => {
                  const currentItemId = watchedItems[index]?.item_id
                  const selectedItem = currentItemId ? itemsMap.get(currentItemId) : null
                  const currentQty = Number(watchedItems[index]?.quantity_ordered) || 0
                  const currentRec = Number(watchedItems[index]?.quantity_received) || 0
                  const currentPrice = Number(watchedItems[index]?.unit_price) || 0
                  const lineTotal = currentQty * currentPrice
                  const unitLabel = selectedItem?.unit_type || 'un'
                  const isItemLocked = currentRec > 0

                  return (
                    <div
                      key={fieldItem.id}
                      className={cn(
                        'p-3.5 rounded-xl border bg-card shadow-sm space-y-3 transition-colors',
                        isItemLocked
                          ? 'border-amber-500/40 bg-amber-500/[0.02]'
                          : 'border-border/70 hover:border-primary/40',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 border-b pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                            Item #{index + 1}
                          </span>
                          {isItemLocked ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1"
                            >
                              <Lock className="h-3 w-3" /> Recebido: {currentRec} {unitLabel} (Não
                              removível)
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-muted-foreground font-medium"
                            >
                              Pendente (sem recebimentos)
                            </Badge>
                          )}
                        </div>

                        {/* Botão de Remover só habilitado se não tiver recebimento */}
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isItemLocked}
                            onClick={() => remove(index)}
                            title={
                              isItemLocked
                                ? 'Não é possível remover item com recebimentos registrados'
                                : 'Remover item da solicitação'
                            }
                            className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs gap-1 disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remover
                          </Button>
                        )}
                      </div>

                      {/* Seleção do Item */}
                      <FormField
                        control={form.control}
                        name={`items.${index}.item_id`}
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="font-bold text-xs flex items-center justify-between">
                              <span>Produto / Material</span>
                              {isItemLocked && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                                  <Lock className="h-3 w-3" /> Produto fixo devido ao recebimento
                                </span>
                              )}
                            </FormLabel>
                            <Popover
                              open={isItemLocked ? false : openItemPopoverIndex === index}
                              onOpenChange={(isOpen) => {
                                if (isItemLocked) return
                                setOpenItemPopoverIndex(isOpen ? index : null)
                              }}
                            >
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isItemLocked}
                                    role="combobox"
                                    className={cn(
                                      'w-full justify-between font-normal h-10 text-left text-xs',
                                      !field.value && 'text-muted-foreground',
                                      isItemLocked && 'cursor-not-allowed opacity-90 bg-muted/30',
                                    )}
                                  >
                                    {selectedItem ? (
                                      <span className="truncate font-semibold text-foreground">
                                        {formatItemDisplay(selectedItem)}
                                        <span className="text-[11px] text-muted-foreground ml-2 font-normal">
                                          (Saldo: {selectedItem.current_quantity}{' '}
                                          {selectedItem.unit_type})
                                        </span>
                                      </span>
                                    ) : (
                                      'Pesquisar e selecionar item do estoque...'
                                    )}
                                    {!isItemLocked && (
                                      <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="p-0"
                                style={{ width: 'var(--radix-popover-trigger-width)' }}
                                align="start"
                              >
                                <Command>
                                  <CommandInput placeholder="Digite o nome ou código do item..." />
                                  <CommandList>
                                    <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                                    <CommandGroup>
                                      {items.map((catItem) => (
                                        <CommandItem
                                          key={catItem.id}
                                          value={`${formatItemDisplay(catItem)} ${catItem.id} ${catItem.supplier || ''}`}
                                          onSelect={() => handleSelectItemForIndex(index, catItem)}
                                        >
                                          <Check
                                            className={cn(
                                              'mr-2 h-4 w-4 shrink-0',
                                              catItem.id === field.value
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                            )}
                                          />
                                          <div className="flex flex-col flex-1 overflow-hidden">
                                            <span className="font-medium text-xs truncate">
                                              {formatItemDisplay(catItem)}
                                            </span>
                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                              <span>
                                                Saldo: {catItem.current_quantity}{' '}
                                                {catItem.unit_type}
                                              </span>
                                              {catItem.supplier && (
                                                <span>• Fornec: {catItem.supplier}</span>
                                              )}
                                              {catItem.unit_price ? (
                                                <span>
                                                  • R$ {Number(catItem.unit_price).toFixed(2)}
                                                </span>
                                              ) : null}
                                            </div>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Quantidade e Valor Unitário e Subtotal da linha */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                        {/* Quantidade Comprada */}
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity_ordered`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-bold text-xs flex items-center justify-between">
                                <span>Quantidade ({unitLabel})</span>
                                {currentRec > 0 && (
                                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                    Mín: {currentRec} {unitLabel}
                                  </span>
                                )}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={currentRec > 0 ? currentRec : 0.01}
                                  step="any"
                                  placeholder="Ex: 100"
                                  className="font-mono text-sm font-semibold h-10"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Valor Unitário */}
                        <FormField
                          control={form.control}
                          name={`items.${index}.unit_price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-bold text-xs flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                  Valor Unit. (R$)
                                </span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0,00"
                                  className="font-mono text-sm font-semibold h-10"
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

                        {/* Subtotal da linha */}
                        <div className="p-2 rounded-lg bg-muted/60 border flex flex-col justify-center h-10 text-right">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">
                            Subtotal da linha
                          </span>
                          <span className="text-xs font-mono font-black text-foreground">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(lineTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Botão extra para adicionar item ao fim da lista */}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  append({
                    item_id: '',
                    quantity_ordered: 1,
                    quantity_received: 0,
                    unit_price: 0,
                  })
                }
                className="w-full border-2 border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-foreground h-11 text-xs font-bold gap-2 rounded-xl"
              >
                <PlusCircle className="h-4 w-4" />
                Adicionar Novo Item a Esta Solicitação
              </Button>
            </div>

            {/* Card com Cálculo Automático do Valor da Nota (SOMA TOTAL) */}
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Cálculo Automático Recalculado
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 font-medium">
                    {fields.length} {fields.length === 1 ? 'item' : 'itens'} no pedido • Total de{' '}
                    {totalUnitsCount.toLocaleString('pt-BR')} unidades
                    {totalReceivedUnits > 0 && ` (${totalReceivedUnits} já recebidas)`}
                  </div>
                </div>
              </div>
              <div className="text-right sm:border-l sm:pl-4 border-emerald-500/20">
                <div className="text-[11px] font-bold text-muted-foreground uppercase">
                  Valor Total da Nota
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    totalInvoiceValue,
                  )}
                </div>
              </div>
            </div>

            {/* Observações */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-xs">
                    Observações{' '}
                    <span className="text-[10px] font-normal text-muted-foreground">
                      (opcional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais, empenho, dotação orçamentária..."
                      className="resize-none h-16 text-xs"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="font-bold">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando alterações...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
