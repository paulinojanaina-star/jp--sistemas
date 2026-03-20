import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { useToast } from '@/hooks/use-toast'
import { Plus, Loader2, CalendarIcon } from 'lucide-react'
import { Item, ITEM_UNITS } from '@/types/inventory'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
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
  manufacturing_date: z.date().optional(),
  expiry_date: z.date().optional(),
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

  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: item?.name || '',
      description: item?.description || '',
      unit_type: (item?.unit_type as any) || undefined,
      min_quantity: item?.min_quantity || 10,
      current_quantity: item?.current_quantity || 0,
      batch_number: '',
    },
  })

  const currentQty = form.watch('current_quantity')

  useEffect(() => {
    if (open) {
      if (item) {
        const latestInMovement = movements
          .filter((m) => m.item_id === item.id && m.type === 'IN')
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

        form.reset({
          name: item.name,
          description: item.description || '',
          unit_type: (item.unit_type as any) || undefined,
          min_quantity: item.min_quantity,
          current_quantity: item.current_quantity,
          batch_number: latestInMovement?.batch_number || '',
          manufacturing_date: latestInMovement?.manufacturing_date
            ? new Date(latestInMovement.manufacturing_date + 'T12:00:00')
            : undefined,
          expiry_date: latestInMovement?.expiry_date
            ? new Date(latestInMovement.expiry_date + 'T12:00:00')
            : undefined,
        })
      } else {
        form.reset({
          name: '',
          description: '',
          unit_type: undefined,
          min_quantity: 10,
          current_quantity: 0,
          batch_number: '',
          manufacturing_date: undefined,
          expiry_date: undefined,
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item])

  const onSubmit = async (values: z.infer<typeof itemSchema>) => {
    setSubmitting(true)

    if (isEditing && item) {
      const { current_quantity, batch_number, manufacturing_date, expiry_date, ...itemData } =
        values
      const { error } = await updateItem(item.id, itemData)

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
        manufacturing_date: manufacturing_date ? format(manufacturing_date, 'yyyy-MM-dd') : null,
        expiry_date: expiry_date ? format(expiry_date, 'yyyy-MM-dd') : null,
      })

      setSubmitting(false)

      if (batchError && (batch_number || manufacturing_date || expiry_date)) {
        toast({
          title: 'Atenção',
          description: `Item salvo, mas não foi possível atualizar o lote: ${batchError.message}`,
          variant: 'destructive',
        })
      } else {
        toast({ title: 'Sucesso!', description: 'Item atualizado com sucesso.' })
      }
    } else {
      const { current_quantity, batch_number, manufacturing_date, expiry_date, ...itemData } =
        values

      const movementData = {
        batch_number: batch_number?.trim() || null,
        manufacturing_date: manufacturing_date ? format(manufacturing_date, 'yyyy-MM-dd') : null,
        expiry_date: expiry_date ? format(expiry_date, 'yyyy-MM-dd') : null,
      }

      const { error } = await addItem(itemData, current_quantity, movementData)
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
                    <FormLabel>Estoque Mínimo</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
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

            {(currentQty > 0 || isEditing) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 mt-2 rounded-md border bg-muted/30">
                <div className="col-span-1 md:col-span-3 pb-2 border-b mb-2">
                  <h4 className="text-sm font-medium text-foreground">
                    Rastreabilidade de Lote e Validade (Opcional)
                  </h4>
                  {isEditing && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Atualiza os dados da última entrada deste item.
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
                        <Input placeholder="Ex: L202305A" {...field} value={field.value || ''} />
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
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal px-2',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'dd/MM/yyyy')
                              ) : (
                                <span className="text-xs">Selecionar</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal px-2',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'dd/MM/yyyy')
                              ) : (
                                <span className="text-xs">Selecionar</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

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
