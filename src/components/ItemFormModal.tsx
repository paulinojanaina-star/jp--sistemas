import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { useToast } from '@/hooks/use-toast'
import { Plus, Loader2 } from 'lucide-react'
import { Item, ITEM_UNITS } from '@/types/inventory'

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
  unit_type: z.string().min(1, 'Selecione a unidade de medida'),
  min_quantity: z.coerce.number().min(0, 'Estoque mínimo não pode ser negativo'),
  current_quantity: z.coerce.number().min(0, 'Saldo inicial não pode ser negativo'),
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
  const { addItem, updateItem } = useInventoryStore()
  const { toast } = useToast()

  const isEditing = !!item

  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: item?.name || '',
      description: item?.description || '',
      unit_type: item?.unit_type || '',
      min_quantity: item?.min_quantity || 10,
      current_quantity: item?.current_quantity || 0,
    },
  })

  useEffect(() => {
    if (open) {
      if (item) {
        form.reset({
          name: item.name,
          description: item.description || '',
          unit_type: item.unit_type,
          min_quantity: item.min_quantity,
          current_quantity: item.current_quantity,
        })
      } else {
        form.reset({
          name: '',
          description: '',
          unit_type: '',
          min_quantity: 10,
          current_quantity: 0,
        })
      }
    }
  }, [open, item, form])

  const onSubmit = async (values: z.infer<typeof itemSchema>) => {
    setSubmitting(true)

    if (isEditing && item) {
      const { current_quantity, ...itemData } = values
      const { error } = await updateItem(item.id, itemData)
      setSubmitting(false)

      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar o item.',
          variant: 'destructive',
        })
        return
      }

      toast({ title: 'Sucesso!', description: 'Item atualizado com sucesso.' })
    } else {
      const { current_quantity, ...itemData } = values
      const { error } = await addItem(itemData, current_quantity)
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
      <DialogContent className="sm:max-w-[500px]">
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição / Observações</FormLabel>
                  <FormControl>
                    <Textarea className="resize-none" {...field} />
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
