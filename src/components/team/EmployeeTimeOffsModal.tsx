import { useTeamStore } from '@/stores/useTeamStore'
import { Employee } from '@/types/team'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface Props {
  employee: Employee | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmployeeTimeOffsModal({ employee, open, onOpenChange }: Props) {
  const { timeOffRequests, deleteTimeOff } = useTeamStore()

  if (!employee) return null

  const employeeRequests = timeOffRequests
    .filter((req) => req.employee_id === employee.id)
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este registro?')) {
      await deleteTimeOff(id)
    }
  }

  const getBadgeStyle = (type: string) => {
    if (type === 'FERIAS') return 'bg-amber-500/10 text-amber-600 border-amber-200'
    if (type === 'ATESTADO') return 'bg-rose-500/10 text-rose-600 border-rose-200'
    if (type === 'ANIVERSARIO') return 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-200'
    return 'bg-blue-500/10 text-blue-600 border-blue-200'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ausências Programadas</DialogTitle>
          <div className="text-sm text-muted-foreground mt-1">
            Profissional: <span className="font-semibold text-foreground">{employee.name}</span>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[400px] mt-4 pr-4">
          {employeeRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
              <CalendarIcon className="h-8 w-8 opacity-20" />
              <p>Nenhuma ausência registrada para este profissional.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {employeeRequests.map((req) => (
                <div key={req.id} className="p-3 rounded-lg border bg-card flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] uppercase font-bold', getBadgeStyle(req.type))}
                    >
                      {req.type}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(req.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(req.start_date), 'dd/MM/yyyy')} até{' '}
                      {format(new Date(req.end_date), 'dd/MM/yyyy')}
                    </span>
                  </div>

                  {req.notes && (
                    <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      {req.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
