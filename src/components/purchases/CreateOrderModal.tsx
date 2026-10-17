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
import { Item } from '@/types/inventory'
import { CreatePurchaseOrderInput } from '@/types/purchaseOrder'
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
} from 'lucide-react'

const orderSchema = z.object({
  request_number: z.string().min(1, 'Digite o número oficial da solicitação').trim(),
  item_id: z.string().min(1, 'Selecione um item'),
  quantity_ordered: z.coerce.number().positive('Quantidade deve ser maior que zero'),
  unit_price: z.coerce.number().min(0, 'Valor unitário não pode ser negativo').optional(),
  supplier: z.string().optional(),
  health_unit_name: z.string().optional(),
  requested_at: z.string().min(1, 'Informe a data da solicitação'),
  expected_date: z.string().optional(),
  notes: z.string().optional(),
})

type OrderFormValues = z.infer<typeof orderSchema>

interface CreateOrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: Item[]
  existingUnits: string[]
  onSubmit: (values: CreatePurchaseOrderInput) => Promise<boolean>
}

export function CreateOrderModal({
  open,
  onOpenChange,
  items,
  existingUnits,
  onSubmit,
}: CreateOrderModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [itemPopoverOpen, setItemPopoverOpen] = useState(false)
  const [unitPopoverOpen, setUnitPopoverOpen] = useState(false)

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema) as any,
    defaultValues: {
      request_number: '',
      item_id: '',
      quantity_ordered: 1,
      unit_price: 0,
      supplier: '',
      health_unit_name: 'APS',
      requested_at: todayStr,
      expected_date: '',
      notes: '',
    },
  })

  const selectedItemId = form.watch('item_id')
  const quantityOrdered = Number(form.watch('quantity_ordered')) || 0
  const unitPrice = Number(form.watch('unit_price')) || 0

  const calculatedTotal = useMemo(() => {
    return Math.max(0, quantityOrdered * unitPrice)
  }, [quantityOrdered, unitPrice])

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedItemId),
    [items, selectedItemId],
  )

  const handleSelectItem = (item: Item) => {
    form.setValue('item_id', item.id, { shouldValidate: true })
    if (item.supplier) {
      form.setValue('supplier', item.supplier)
    }
    // Pre-popula o valor unitário com o preço atual cadastrado do item, se houver
    if (item.unit_price && Number(item.unit_price) > 0) {
      form.setValue('unit_price', Number(item.unit_price))
    }
    setItemPopoverOpen(false)
  }

  const handleFormSubmit = async (values: OrderFormValues) => {
    setSubmitting(true)
    const price = Number(values.unit_price) || 0
    const qty = Number(values.quantity_ordered)
    const total = price * qty

    const success = await onSubmit({
      request_number: values.request_number,
      item_id: values.item_id,
      quantity_ordered: qty,
      unit_price: price,
      total_price: total,
      supplier: values.supplier || null,
      health_unit_name: values.health_unit_name || null,
      requested_at: values.requested_at,
      expected_date: values.expected_date || null,
      notes: values.notes || null,
    })
    setSubmitting(false)
    if (success) {
      form.reset({
        request_number: '',
        item_id: '',
        quantity_ordered: 1,
        unit_price: 0,
        supplier: '',
        health_unit_name: 'APS',
        requested_at: todayStr,
        expected_date: '',
        notes: '',
      })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black">Nova Solicitação de Compra</DialogTitle>
              <DialogDescription className="text-xs">
                Registre uma nova ordem de compra para controle de entrega e recebimentos parciais.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 pt-2">
            {/* Número da Solicitação (digitado) */}
            <FormField
              control={form.control}
              name="request_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold flex items-center justify-between">
                    <span>Nº Oficial da Solicitação / Processo</span>
                    <span className="text-[11px] font-normal text-muted-foreground">
                      (Digitado livremente pelo usuário)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: SC-2026/045, PED-8891, 1234/26..."
                      className="font-mono text-base font-semibold"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Seleção do Item */}
            <FormField
              control={form.control}
              name="item_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="font-bold">Item a Comprar</FormLabel>
                  <Popover open={itemPopoverOpen} onOpenChange={setItemPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'w-full justify-between font-normal h-11 text-left',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {selectedItem ? (
                            <span className="truncate font-semibold text-foreground">
                              {formatItemDisplay(selectedItem)}
                              <span className="text-xs text-muted-foreground ml-2 font-normal">
                                (Saldo atual: {selectedItem.current_quantity}{' '}
                                {selectedItem.unit_type})
                              </span>
                            </span>
                          ) : (
                            'Pesquisar e selecionar item do estoque...'
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                            {items.map((item) => (
                              <CommandItem
                                key={item.id}
                                value={`${formatItemDisplay(item)} ${item.id} ${item.supplier || ''}`}
                                onSelect={() => handleSelectItem(item)}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4 shrink-0',
                                    item.id === field.value ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                                <div className="flex flex-col flex-1 overflow-hidden">
                                  <span className="font-medium text-sm truncate">
                                    {formatItemDisplay(item)}
                                  </span>
                                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                    <span>
                                      Saldo: {item.current_quantity} {item.unit_type}
                                    </span>
                                    {item.supplier && <span>• Fornecedor: {item.supplier}</span>}
                                    {item.unit_price ? (
                                      <span>• R$ {Number(item.unit_price).toFixed(2)}</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Quantidade Comprada */}
              <FormField
                control={form.control}
                name="quantity_ordered"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">
                      Quantidade Comprada
                      {selectedItem && (
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          ({selectedItem.unit_type})
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0.01"
                        step="any"
                        placeholder="Ex: 100"
                        className="font-mono text-base font-semibold"
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
                name="unit_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        Valor Unitário (R$)
                      </span>
                      {selectedItem?.unit_price && Number(selectedItem.unit_price) > 0 ? (
                        <span className="text-[10px] text-muted-foreground">
                          Atual: R$ {Number(selectedItem.unit_price).toFixed(2)}
                        </span>
                      ) : null}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0,00"
                        className="font-mono text-base font-semibold"
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

            {/* Card com Cálculo Automático do Valor da Nota */}
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Calculator className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Cálculo Automático da Nota
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {quantityOrdered} {selectedItem?.unit_type || 'un'} ×{' '}
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      unitPrice,
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right sm:border-l sm:pl-4 border-emerald-500/20">
                <div className="text-[11px] font-bold text-muted-foreground uppercase">
                  Valor Total da Nota
                </div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    calculatedTotal,
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Fornecedor */}
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold flex items-center justify-between">
                      <span>Fornecedor</span>
                      {selectedItem?.supplier && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          (Preenchido pelo item)
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Distribuidora MedHospital..."
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Unidade de Saúde de Destino */}
              <FormField
                control={form.control}
                name="health_unit_name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-1">
                    <FormLabel className="font-bold flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      Unidade de Destino
                    </FormLabel>
                    <Popover open={unitPopoverOpen} onOpenChange={setUnitPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between font-normal text-left truncate"
                          >
                            <span className="truncate">
                              {field.value || 'Selecione ou digite...'}
                            </span>
                            <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-64" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar ou nova unidade..." />
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
                    <FormLabel className="font-bold">Data da Solicitação</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel className="font-bold">
                      Previsão de Entrega{' '}
                      <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Observações */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">
                    Observações{' '}
                    <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais, empenho, dotação orçamentária..."
                      className="resize-none h-20 text-sm"
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
                    Salvando...
                  </>
                ) : (
                  'Criar Solicitação'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
