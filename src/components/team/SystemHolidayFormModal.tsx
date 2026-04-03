import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { useTeamStore } from '@/stores/useTeamStore'
import { useToast } from '@/hooks/use-toast'

const formSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  date: z.string().min(10, 'A data é obrigatória'),
})

type FormValues = z.infer<typeof formSchema>

interface SystemHolidayFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  holiday: any | null
}

export function SystemHolidayFormModal({
  open,
  onOpenChange,
  holiday,
}: SystemHolidayFormModalProps) {
  const { saveSystemHoliday } = useTeamStore()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      date: '',
    },
  })

  useEffect(() => {
    if (holiday && open) {
      form.reset({
        name: holiday.name,
        date: holiday.date,
      })
    } else if (!open) {
      form.reset({
        name: '',
        date: '',
      })
    }
  }, [holiday, open, form])

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)

    const { error } = await saveSystemHoliday(holiday?.id || null, {
      name: data.name,
      date: data.date,
    })

    setIsSubmitting(false)

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao salvar o ponto facultativo.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Sucesso',
        description: `Ponto facultativo ${holiday ? 'atualizado' : 'criado'} com sucesso.`,
      })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {holiday ? 'Editar Ponto Facultativo' : 'Novo Ponto Facultativo'}
          </DialogTitle>
          <DialogDescription>
            Defina uma data para ser considerada como folga automática para toda a equipe.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome / Motivo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Ponto Facultativo - Carnaval" {...field} />
                  </FormControl>
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

            <div className="flex justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="mr-2"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
