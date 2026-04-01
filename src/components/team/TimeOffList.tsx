import { useState, useMemo } from 'react'
import { useTeamStore } from '@/stores/useTeamStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns'
import { Edit, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface Props {
  onEdit: (id: string) => void
}

export function TimeOffList({ onEdit }: Props) {
  const { timeOffRequests, deleteTimeOff } = useTeamStore()
  const [search, setSearch] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  const filteredRequests = useMemo(() => {
    const today = startOfDay(new Date())

    return timeOffRequests
      .filter((req) => {
        const empName = req.employees?.name || 'Sistema'
        const matchesSearch = empName.toLowerCase().includes(search.toLowerCase())

        if (!matchesSearch) return false

        if (!showHistory) {
          const endDate = endOfDay(parseISO(req.end_date))
          if (endDate < today) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime())
  }, [timeOffRequests, search, showHistory])

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta escala?')) {
      await deleteTimeOff(id)
    }
  }

  const getBadgeStyle = (type: string) => {
    if (type === 'FERIAS') return 'bg-amber-500/10 text-amber-600 border-amber-200'
    if (type === 'ATESTADO') return 'bg-rose-500/10 text-rose-600 border-rose-200'
    if (type === 'ANIVERSARIO') return 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-200'
    if (type === 'PONTO_FACULTATIVO') return 'bg-blue-500/10 text-blue-600 border-blue-200'
    return 'bg-slate-500/10 text-slate-600 border-slate-200'
  }

  const getStatus = (start: string, end: string) => {
    const today = new Date()
    const startDate = startOfDay(parseISO(start))
    const endDate = endOfDay(parseISO(end))

    if (isWithinInterval(today, { start: startDate, end: endDate })) {
      return (
        <Badge
          variant="secondary"
          className="bg-green-500/10 text-green-600 hover:bg-green-500/20 text-[10px] uppercase border-none"
        >
          Ativo
        </Badge>
      )
    }
    if (today < startDate) {
      return (
        <Badge
          variant="secondary"
          className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 text-[10px] uppercase border-none"
        >
          Futuro
        </Badge>
      )
    }
    return (
      <Badge
        variant="secondary"
        className="bg-gray-500/10 text-gray-600 hover:bg-gray-500/20 text-[10px] uppercase border-none"
      >
        Concluído
      </Badge>
    )
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Todas as Escalas Programadas</CardTitle>
            <CardDescription className="text-base mt-1">
              Visão geral de todas as ausências ativas e futuras
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do profissional..."
              className="pl-9 h-10 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="show-history" checked={showHistory} onCheckedChange={setShowHistory} />
            <Label
              htmlFor="show-history"
              className="text-sm font-medium cursor-pointer whitespace-nowrap"
            >
              Mostrar histórico completo
            </Label>
          </div>
        </div>

        <div className="space-y-4 mt-4">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="p-4 rounded-xl border bg-card flex flex-col gap-2 transition-colors hover:border-border/80"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-base text-foreground">
                      {req.employees?.name || 'Sistema'}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] uppercase font-bold px-2 py-0.5',
                        getBadgeStyle(req.type),
                      )}
                    >
                      {req.type}
                    </Badge>
                    {getStatus(req.start_date, req.end_date)}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    {format(parseISO(req.start_date), 'dd/MM/yyyy')} até{' '}
                    {format(parseISO(req.end_date), 'dd/MM/yyyy')}
                    <span className="uppercase text-xs ml-1">({req.employees?.category})</span>
                  </div>
                  {req.notes && (
                    <div className="text-sm text-muted-foreground italic mt-2">"{req.notes}"</div>
                  )}
                </div>

                {!req.id.startsWith('auto-') && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(req.id)}>
                      <Edit className="h-4 w-4 text-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(req.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredRequests.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border rounded-xl border-dashed bg-background/50">
              Nenhuma escala encontrada com este nome.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
