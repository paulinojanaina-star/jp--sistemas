import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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
import { useInventoryStore } from '@/stores/useInventoryStore'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Movement } from '@/types/inventory'
import { Loader2, ShieldAlert } from 'lucide-react'

const editSchema = z.object({
  quantity: z.coerce.number().positive('A quantidade deve ser maior que zero'),
  health_unit_name: z.string().min(2, 'Especifique a origem ou destino').trim(),
  batch_number: z.string().optional(),
  manufacturing_date: z.string().optional(),
  expiry_date: z.string().optional(),
  observations: z.string().optional(),
  edit_justification: z.string().min(5, 'A justificativa é obrigatória (mín. 5 caracteres)').trim(),
  password: z.string().min(1, 'A senha é obrigatória para validar a alteração'),
})

export function EditMovementDialog({
  movement,
  open,
  onOpenChange,
}: {
  movement: Movement | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { updateMovement } = useInventoryStore()
  const { session, signIn } = useAuth()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      quantity: 1,
      health_unit_name: '',
      batch_number: '',
      manufacturing_date: '',
      expiry_date: '',
      observations: '',
      edit_justification: '',
      password: '',
    },
  })

  useEffect(() => {
    if (open && movement) {
      form.reset({
        quantity: movement.quantity,
        health_unit_name: movement.health_unit_name,
        batch_number: movement.batch_number || '',
        manufacturing_date: movement.manufacturing_date || '',
        expiry_date: movement.expiry_date || '',
        observations: movement.observations || '',
        edit_justification: '',
        password: '',
      })
    }
  }, [open, movement, form])

  const onSubmit = async (values: z.infer<typeof editSchema>) => {
    if (!movement || !session?.user?.email) return
    setSubmitting(true)

    const { error: authError } = await signIn(session.user.email, values.password)
    if (authError) {
      setSubmitting(false)
      return form.setError('password', { message: 'Senha incorreta. Verifique e tente novamente.' })
    }

    const payload = {
      quantity: values.quantity,
      health_unit_name: values.health_unit_name,
      batch_number: values.batch_number || null,
      manufacturing_date: values.manufacturing_date || null,
      expiry_date: values.expiry_date || null,
      observations: values.observations || null,
      edit_justification: values.edit_justification,
    }

    const { error: updateError } = await updateMovement(movement.id, payload)
    setSubmitting(false)

    if (updateError) {
      toast({
        title: 'Erro ao salvar',
        description: updateError.message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Histórico Atualizado',
        description: 'As alterações foram salvas com sucesso no histórico.',
      })
      onOpenChange(false)
    }
  }

  if (!movement) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Editar Movimentação
          </DialogTitle>
          <DialogDescription>
            Alterações no histórico requerem justificativa e confirmação de senha.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="health_unit_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem / Destino</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <FormField
                control={form.control}
                name="batch_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Lote</FormLabel>
                    <FormControl>
                      <Input className="h-8 text-sm" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="manufacturing_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Fab.</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-8 text-sm" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Val.</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-8 text-sm" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea className="h-16 resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="p-3 bg-muted/30 border rounded-md space-y-4">
              <FormField
                control={form.control}
                name="edit_justification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary font-medium">
                      Justificativa da Alteração (Obrigatório)
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Motivo para a edição deste registro..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary font-medium">Confirme sua Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Sua senha de acesso..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
