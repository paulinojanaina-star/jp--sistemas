import { useTeamStore } from '@/stores/useTeamStore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, Calendar as CalendarIcon, Umbrella } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface SystemHolidayListProps {
  onEdit: (id: string) => void
}

export function SystemHolidayList({ onEdit }: SystemHolidayListProps) {
  const { systemHolidays, deleteSystemHoliday } = useTeamStore()
  const { toast } = useToast()

  const handleDelete = async (id: string) => {
    const { error } = await deleteSystemHoliday(id)
    if (error) {
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Ocorreu um erro ao excluir o ponto facultativo.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Sucesso',
        description: 'Ponto facultativo excluído com sucesso.',
      })
    }
  }

  if (systemHolidays.length === 0) {
    return (
      <Card className="p-8 text-center flex flex-col items-center justify-center bg-muted/30 border-dashed">
        <Umbrella className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold text-foreground">Nenhum ponto facultativo</h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-1">
          Os pontos facultativos inseridos aqui serão automaticamente considerados como folga para
          toda a equipe.
        </p>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {systemHolidays.map((holiday) => (
        <Card
          key={holiday.id}
          className="p-5 flex flex-col gap-4 bg-white dark:bg-slate-900 border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h4 className="font-bold text-base leading-none">{holiday.name}</h4>
              <div className="flex items-center text-sm text-muted-foreground gap-1.5 mt-2">
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>
                  {format(parseISO(holiday.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-blue-600"
                onClick={() => onEdit(holiday.id)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir ponto facultativo?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso removerá a folga automática para toda a
                      equipe nesta data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(holiday.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
