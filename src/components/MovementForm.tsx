import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { useToast } from '@/hooks/use-toast'
import { AlertCircle, ArrowDownToLine, ArrowUpFromLine, Save } from 'lucide-react'

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
  itemId: z.string().min(1, 'Selecione um item'),
  type: z.enum(['ENTRADA', 'SAIDA']),
  quantity: z.coerce.number().min(1, 'A quantidade deve ser maior que zero'),
  responsible: z.string().min(2, 'Nome do responsável é obrigatório'),
  unitOriginDest: z.string().min(2, 'Especifique a origem ou destino'),
  date: z.string().min(1, 'Data é obrigatória'),
  observation: z.string().optional(),
})

export function MovementForm() {
  const { items, addMovement } = useInventoryStore()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof movementSchema>>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      type: 'SAIDA',
      quantity: 1,
      date: new Date().toISOString().split('T')[0],
      responsible: '',
      unitOriginDest: '',
      observation: '',
    },
  })

  const selectedItemId = form.watch('itemId')
  const selectedType = form.watch('type')
  const quantityInput = form.watch('quantity')

  const selectedItem = items.find((i) => i.id === selectedItemId)
  const isOutbound = selectedType === 'SAIDA'

  const quantity = Number(quantityInput) || 0
  const willBeNegative = selectedItem && isOutbound && quantity > selectedItem.currentStock
  const newBalance = selectedItem
    ? isOutbound
      ? selectedItem.currentStock - quantity
      : selectedItem.currentStock + quantity
    : null

  const onSubmit = (values: z.infer<typeof movementSchema>) => {
    if (willBeNegative) {
      form.setError('quantity', { message: 'Quantidade excede o saldo atual!' })
      return
    }

    addMovement(values)
    toast({
      title: values.type === 'ENTRADA' ? 'Entrada registrada' : 'Saída registrada',
      description: `Movimentação de ${values.quantity} ${selectedItem?.unit}(s) de ${selectedItem?.name} salva.`,
    })

    form.reset({ ...form.getValues(), itemId: '', quantity: 1, observation: '' })
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
                        <SelectItem value="ENTRADA">
                          <div className="flex items-center gap-2">
                            <ArrowDownToLine className="text-emerald-500 h-4 w-4" /> Entrada
                            (Recebimento)
                          </div>
                        </SelectItem>
                        <SelectItem value="SAIDA">
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

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="itemId"
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
                            (Saldo: {item.currentStock} {item.unit})
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
                      {newBalance} {selectedItem.unit}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="responsible"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do solicitante/entregador" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unitOriginDest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {isOutbound ? 'Unidade de Destino' : 'Origem / Fornecedor'}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: UTI, Posto de Enfermagem..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="observation"
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

            <Button type="submit" size="lg" className="w-full md:w-auto" disabled={willBeNegative}>
              <Save className="mr-2 h-5 w-5" /> Confirmar Movimentação
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
