import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { useToast } from '@/hooks/use-toast'
import { Plus, Loader2 } from 'lucide-react'
import { Item, ITEM_UNITS } from '@/types/inventory'
import { calculateConsumption } from '@/utils/consumptionLogic'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const itemSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  unit_type: z.enum(['Caixa', 'Unidade', 'Rolo', 'Litro', 'Frasco', 'Par', 'Pacote'], {
    errorMap: () => ({ message: 'Selecione uma unidade de medida válida' }),
  }),
  min_quantity: z.coerce.number().min(0, 'Estoque mínimo não pode ser negativo'),
  current_quantity: z.coerce.number().min(0, 'Saldo inicial não pode ser negativo'),
  batch_number: z.string().optional(),
  manufacturing_date: z.string().optional(),
  expiry_date: z.string().optional(),
  supplier: z.string().optional(),
})

interface ItemFormModalProps {
  item?: Item
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

export function ItemFormModal({
  item,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: ItemFormModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled && controlledOnOpenChange ? controlledOnOpenChange : setInternalOpen

  const [submitting, setSubmitting] = useState(false)
  const { addItem, updateItem, updateItemBatchInfo, movements } = useInventoryStore()
  const { toast } = useToast()

  const isEditing = !!item

  const latestInMovement = item
    ? movements
        .filter((m) => m.item_id === item.id && m.type === 'IN')
        .sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
        )[0]
    : null

  const consumption = item ? calculateConsumption(item, movements) : null
  const suggestedMinStock =
    consumption && consumption.dailyConsumption > 0
      ? Math.ceil(consumption.dailyConsumption * 40)
      : 0

  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: item?.name || '',
      description: item?.description || '',
      unit_type: (item?.unit_type as any) || undefined,
      min_quantity: item?.min_quantity ?? (suggestedMinStock > 0 ? suggestedMinStock : 10),
      current_quantity: item?.current_quantity || 0,
      batch_number: '',
      manufacturing_date: '',
      expiry_date: '',
      supplier: item?.supplier || '',
    },
  })

  const currentQuantity = form.watch('current_quantity') || 0
  const disableBatchFields = !isEditing && currentQuantity <= 0

  useEffect(() => {
    if (open) {
      if (item) {
        form.reset({
          name: item.name,
          description: item.description || '',
          unit_type: (item.unit_type as any) || undefined,
          min_quantity: item.min_quantity,
          current_quantity: item.current_quantity,
          batch_number: latestInMovement?.batch_number || '',
          manufacturing_date: latestInMovement?.manufacturing_date
            ? latestInMovement.manufacturing_date.split('T')[0]
            : '',
          expiry_date: latestInMovement?.expiry_date
            ? latestInMovement.expiry_date.split('T')[0]
            : '',
          supplier: item.supplier || '',
        })
      } else {
        form.reset({
          name: '',
          description: '',
          unit_type: undefined,
          min_quantity: 10,
          current_quantity: 0,
          batch_number: '',
          manufacturing_date: '',
          expiry_date: '',
          supplier: '',
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item])

  const onSubmit = async (values: z.infer<typeof itemSchema>) => {
    setSubmitting(true)

    const {
      current_quantity,
      batch_number,
      manufacturing_date,
      expiry_date,
      supplier,
      ...itemData
    } = values

    const parsedSupplier = supplier?.trim() || null

    if (isEditing && item) {
      const { error } = await updateItem(item.id, { ...itemData, supplier: parsedSupplier })

      if (error) {
        setSubmitting(false)
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar o item.',
          variant: 'destructive',
        })
        return
      }

      const { error: batchError } = await updateItemBatchInfo(item.id, {
        batch_number: batch_number?.trim() || null,
        manufacturing_date: manufacturing_date || null,
        expiry_date: expiry_date || null,
      })

      if (batchError && (batch_number || manufacturing_date || expiry_date)) {
        toast({
          title: 'Atenção',
          description: `Item salvo, mas não foi possível atualizar a validade: ${batchError.message}`,
          variant: 'destructive',
        })
      } else {
        toast({ title: 'Sucesso!', description: 'Item atualizado com sucesso.' })
      }

      setSubmitting(false)
    } else {
      if (current_quantity === 0 && (batch_number || manufacturing_date || expiry_date)) {
        setSubmitting(false)
        form.setError('current_quantity', {
          type: 'manual',
          message: 'Para registrar lote ou validade, o Saldo Inicial deve ser maior que zero.',
        })
        return
      }

      const movementData = {
        batch_number: batch_number?.trim() || null,
        manufacturing_date: manufacturing_date || null,
        expiry_date: expiry_date || null,
      }

      const { error } = await addItem(
        { ...itemData, supplier: parsedSupplier },
        current_quantity,
        movementData,
      )
      setSubmitting(false)

      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível cadastrar o item.',
          variant: 'destructive',
        })
        return
      }

      toast({ title: 'Sucesso!', description: 'Item cadastrado com sucesso no banco de dados.' })
    }

    setOpen(false)
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || (
            <Button className="gap-2">
              <Plus size={16} /> Novo Item
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Item' : 'Cadastrar Novo Item'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Item</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Seringa 10ml" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unit_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade de Medida</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ITEM_UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex justify-between items-center h-5">
                      <span>Estoque Mínimo</span>
                      {suggestedMinStock > 0 && (
                        <button
                          type="button"
                          className="text-[10px] text-primary hover:bg-primary/20 font-medium bg-primary/10 px-2 py-0.5 rounded-full transition-colors"
                          onClick={() =>
                            form.setValue('min_quantity', suggestedMinStock, {
                              shouldValidate: true,
                            })
                          }
                          title="Calcular estoque de segurança (40 dias de consumo)"
                        >
                          Sugerir: {suggestedMinStock}
                        </button>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    {suggestedMinStock > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Recomendado p/ 40 dias: {suggestedMinStock}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!isEditing && (
              <FormField
                control={form.control}
                name="current_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saldo Inicial</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 mt-2 rounded-md border bg-muted/30">
              <div className="col-span-1 md:col-span-3 pb-2 border-b mb-2">
                <h4 className="text-sm font-medium text-foreground">
                  Rastreabilidade de Lote e Validade (Opcional)
                </h4>
                {!isEditing ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Para registrar lote e validade, é necessário que o Saldo Inicial seja maior que
                    zero.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Atualiza a validade e o lote da última entrada registrada no estoque.
                  </p>
                )}
              </div>

              <FormField
                control={form.control}
                name="batch_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lote</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: L202305A"
                        {...field}
                        value={field.value || ''}
                        disabled={disableBatchFields}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="manufacturing_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col mt-2 md:mt-0">
                    <FormLabel className="mb-1">Fabricação</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        max={todayStr}
                        {...field}
                        value={field.value || ''}
                        disabled={disableBatchFields}
                        className="w-full text-sm"
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
                  <FormItem className="flex flex-col mt-2 md:mt-0">
                    <FormLabel className="mb-1">Validade</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ''}
                        disabled={disableBatchFields}
                        className="w-full text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Distribuidora Med Ltda"
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição / Observações</FormLabel>
                  <FormControl>
                    <Textarea className="resize-none" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                className="mr-2"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Salvar Alterações' : 'Salvar Item'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
