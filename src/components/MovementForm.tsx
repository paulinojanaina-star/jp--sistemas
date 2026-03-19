import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Save,
  Loader2,
  Check,
  ChevronsUpDown,
  CalendarIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { formatItemDisplay } from '@/utils/itemFormat'

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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Calendar } from '@/components/ui/calendar'

const movementSchema = z.object({
  item_id: z.string().min(1, 'Selecione um item'),
  type: z.enum(['IN', 'OUT']),
  quantity: z.coerce.number().positive('A quantidade deve ser maior que zero'),
  health_unit_name: z.string().min(2, 'Especifique a origem ou destino').trim(),
  observations: z.string().optional(),
  file: z.any().optional(),
  batch_number: z.string().optional(),
  manufacturing_date: z.date().optional(),
  expiry_date: z.date().optional(),
})

export function MovementForm() {
  const { items, addMovement } = useInventoryStore()
  const { session } = useAuth()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [openItemPopover, setOpenItemPopover] = useState(false)

  const form = useForm<z.infer<typeof movementSchema>>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      type: 'OUT',
      health_unit_name: '',
      observations: '',
      item_id: '',
      batch_number: '',
    },
  })

  const selectedItemId = form.watch('item_id')
  const selectedType = form.watch('type')
  const quantityInput = form.watch('quantity')

  const selectedItem = items.find((i) => i.id === selectedItemId)
  const isOutbound = selectedType === 'OUT'
  const quantity = Number(quantityInput) || 0
  const willBeNegative = selectedItem && isOutbound && quantity > selectedItem.current_quantity
  const newBalance = selectedItem
    ? isOutbound
      ? selectedItem.current_quantity - quantity
      : selectedItem.current_quantity + quantity
    : null

  const onSubmit = async (values: z.infer<typeof movementSchema>) => {
    if (willBeNegative)
      return form.setError('quantity', { message: 'Quantidade excede o saldo atual!' })
    if (!session?.user?.id) return toast({ title: 'Erro de Autenticação', variant: 'destructive' })

    setSubmitting(true)
    let documentUrl = undefined

    if (isOutbound && values.file && values.file.length > 0) {
      const file = values.file[0] as File
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${session.user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('movement-attachments')
        .upload(filePath, file)
      if (uploadError) {
        setSubmitting(false)
        return toast({
          title: 'Erro no Upload',
          description: uploadError.message,
          variant: 'destructive',
        })
      }
      documentUrl = supabase.storage.from('movement-attachments').getPublicUrl(filePath)
        .data.publicUrl
    }

    const movementPayload = {
      item_id: values.item_id,
      type: values.type.toUpperCase() as 'IN' | 'OUT',
      quantity: Number(values.quantity),
      health_unit_name: values.health_unit_name.trim(),
      observations: values.observations?.trim() || undefined,
      responsible_id: session.user.id,
      document_url: documentUrl,
      ...(values.type === 'IN' && {
        batch_number: values.batch_number?.trim() || null,
        manufacturing_date: values.manufacturing_date
          ? format(values.manufacturing_date, 'yyyy-MM-dd')
          : null,
        expiry_date: values.expiry_date ? format(values.expiry_date, 'yyyy-MM-dd') : null,
      }),
    }

    const { error } = await addMovement(movementPayload)
    setSubmitting(false)

    if (error)
      return toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })

    toast({
      title: isOutbound ? 'Saída registrada' : 'Entrada registrada',
      description: `Movimentação salva com sucesso.`,
    })
    form.reset({
      ...form.getValues(),
      item_id: '',
      quantity: 1,
      observations: '',
      file: undefined,
      batch_number: '',
      manufacturing_date: undefined,
      expiry_date: undefined,
    })
    const fileInput = document.getElementById('file-upload') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Movimentação</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="IN">
                          <div className="flex items-center gap-2">
                            <ArrowDownToLine className="text-emerald-500 h-4 w-4" /> Entrada
                          </div>
                        </SelectItem>
                        <SelectItem value="OUT">
                          <div className="flex items-center gap-2">
                            <ArrowUpFromLine className="text-primary h-4 w-4" /> Saída
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <FormLabel>Responsável (Automático)</FormLabel>
                <div className="h-10 px-3 py-2 border rounded-md bg-muted text-sm text-muted-foreground flex items-center">
                  {session?.user?.email}
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="item_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Item</FormLabel>
                  <Popover open={openItemPopover} onOpenChange={setOpenItemPopover}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openItemPopover}
                          className={cn(
                            'w-full justify-between font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value
                            ? (() => {
                                const item = items.find((i) => i.id === field.value)
                                return item
                                  ? `${formatItemDisplay(item)} (Saldo: ${item.current_quantity})`
                                  : 'Selecione o item'
                              })()
                            : 'Pesquise e selecione o item'}
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
                        <CommandInput placeholder="Buscar item..." />
                        <CommandList>
                          <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                          <CommandGroup>
                            {items.map((item) => (
                              <CommandItem
                                value={`${formatItemDisplay(item)} ${item.id}`}
                                key={item.id}
                                onSelect={() => {
                                  form.setValue('item_id', item.id, { shouldValidate: true })
                                  setOpenItemPopover(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    item.id === field.value ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                                {formatItemDisplay(item)}
                                <span className="text-muted-foreground text-xs ml-2">
                                  (Saldo: {item.current_quantity})
                                </span>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} className="text-lg font-mono" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedItem && (
                  <div
                    className={`p-3 rounded-md border text-sm flex justify-between items-center ${willBeNegative ? 'bg-destructive/10 border-destructive/30 text-destructive' : 'bg-muted/50 border-border'}`}
                  >
                    <span>Novo Saldo:</span>
                    <span className="font-bold text-base">
                      {newBalance} {selectedItem.unit_type}
                    </span>
                  </div>
                )}
              </div>
              <FormField
                control={form.control}
                name="health_unit_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isOutbound ? 'Unidade de Destino' : 'Origem / Fornecedor'}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: UTI, Almoxarifado..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!isOutbound && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-md border border-emerald-100 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/10">
                <FormField
                  control={form.control}
                  name="batch_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lote (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: L202305A" {...field} />
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
                      <FormLabel className="mb-1">Data de Fabricação (Opcional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'dd/MM/yyyy')
                              ) : (
                                <span>Selecione a data</span>
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
                      <FormLabel className="mb-1">Data de Validade (Opcional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'dd/MM/yyyy')
                              ) : (
                                <span>Selecione a data</span>
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

            {isOutbound && (
              <FormField
                control={form.control}
                name="file"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Anexar Comprovante ou Foto (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        id="file-upload"
                        type="file"
                        accept="image/jpeg, image/png, application/pdf"
                        onChange={(e) => onChange(e.target.files)}
                        {...fieldProps}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações Adicionais (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      className="resize-none h-20"
                      placeholder="Motivo específico..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {willBeNegative && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro de Validação</AlertTitle>
                <AlertDescription>O saldo não pode ficar negativo.</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full md:w-auto"
              disabled={willBeNegative || submitting}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Save className="mr-2 h-5 w-5" />
              )}
              {submitting ? 'Salvando...' : 'Confirmar Movimentação'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
