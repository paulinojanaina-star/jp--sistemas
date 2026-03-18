import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { AlertCircle, ArrowDownToLine, ArrowUpFromLine, Save, Loader2 } from 'lucide-react'

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
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const movementSchema = z.object({
  item_id: z.string().min(1, 'Selecione um item'),
  type: z.enum(['IN', 'OUT']),
  quantity: z.coerce.number().positive('A quantidade deve ser maior que zero'),
  health_unit_name: z.string().min(2, 'Especifique a origem ou destino').trim(),
  observations: z.string().optional(),
})

export function MovementForm() {
  const { items, addMovement } = useInventoryStore()
  const { session } = useAuth()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<z.infer<typeof movementSchema>>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      type: 'OUT',
      health_unit_name: '',
      observations: '',
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
    if (willBeNegative) {
      form.setError('quantity', { message: 'Quantidade excede o saldo atual!' })
      return
    }

    if (!session?.user?.id) {
      toast({
        title: 'Erro de Autenticação',
        description: 'Usuário não autenticado',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)

    // Ensure strict payload formatting to match database constraints perfectly
    const movementPayload = {
      item_id: values.item_id,
      type: values.type.toUpperCase() as 'IN' | 'OUT',
      quantity: Number(values.quantity),
      health_unit_name: values.health_unit_name.trim(),
      observations: values.observations?.trim() || undefined,
      responsible_id: session.user.id,
    }

    const { error } = await addMovement(movementPayload)
    setSubmitting(false)

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Falha ao registrar movimentação.',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: values.type === 'IN' ? 'Entrada registrada' : 'Saída registrada',
      description: `Movimentação de ${values.quantity} ${selectedItem?.unit_type}(s) de ${selectedItem?.name} salva.`,
    })

    form.reset({ ...form.getValues(), item_id: '', quantity: 1, observations: '' })
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
                            (Recebimento)
                          </div>
                        </SelectItem>
                        <SelectItem value="OUT">
                          <div className="flex items-center gap-2">
                            <ArrowUpFromLine className="text-primary h-4 w-4" /> Saída
                            (Distribuição)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
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
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pesquise e selecione o item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}{' '}
                          <span className="text-muted-foreground text-xs ml-2">
                            (Saldo: {item.current_quantity} {item.unit_type})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <span>Novo Saldo Previsto:</span>
                    <span className="font-bold text-base">
                      {newBalance} {selectedItem.unit_type}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="health_unit_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {isOutbound ? 'Unidade de Destino' : 'Origem / Fornecedor'}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: UTI, Almoxarifado Central..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações Adicionais (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      className="resize-none h-20"
                      placeholder="Motivo específico, número do lote..."
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
                <AlertDescription>
                  O saldo não pode ficar negativo. Ajuste a quantidade.
                </AlertDescription>
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
