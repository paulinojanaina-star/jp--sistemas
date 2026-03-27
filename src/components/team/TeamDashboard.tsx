import { useTeamStore } from '@/stores/useTeamStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  Palmtree,
  CalendarOff,
  Stethoscope,
  AlertTriangle,
  Trash2,
  Edit,
} from 'lucide-react'
import { useState } from 'react'
import { TimeOffFormModal } from './TimeOffFormModal'
import { TimeOffRequest } from '@/types/team'

export function TeamDashboard() {
  const { employees, timeOffRequests, deleteTimeOff } = useTeamStore()
  const [editingRequest, setEditingRequest] = useState<TimeOffRequest | null>(null)

  const todayStr = new Date().toISOString().split('T')[0]

  const activeVacations = timeOffRequests.filter(
    (r) => r.type === 'FERIAS' && r.start_date <= todayStr && r.end_date >= todayStr,
  )
  const activeDaysOff = timeOffRequests.filter(
    (r) => r.type === 'FOLGA' && r.start_date <= todayStr && r.end_date >= todayStr,
  )
  const activeAtestados = timeOffRequests.filter(
    (r) => r.type === 'ATESTADO' && r.start_date <= todayStr && r.end_date >= todayStr,
  )

  const tmrDate = new Date()
  tmrDate.setDate(tmrDate.getDate() + 1)
  const tmrStr = tmrDate.toISOString().split('T')[0]

  const nextWeekEndDate = new Date()
  nextWeekEndDate.setDate(nextWeekEndDate.getDate() + 7)
  const nextWeekEndStr = nextWeekEndDate.toISOString().split('T')[0]

  const nextWeekAbsences = timeOffRequests
    .filter((r) => r.start_date <= nextWeekEndStr && r.end_date >= tmrStr)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))

  const upcomingRequests = timeOffRequests
    .filter((r) => r.end_date >= todayStr)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro de ausência?')) {
      await deleteTimeOff(id)
    }
  }

  const formatDateBR = (dateStr: string) => {
    const parts = dateStr.split('-')
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
    return dateStr
  }

  const getBadgeStyle = (type: string) => {
    if (type === 'FERIAS') return 'bg-amber-500 hover:bg-amber-600 text-white border-transparent'
    if (type === 'ATESTADO') return 'bg-rose-500 hover:bg-rose-600 text-white border-transparent'
    return 'text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100'
  }

  const renderRequest = (req: TimeOffRequest) => {
    const isActive = req.start_date <= todayStr && req.end_date >= todayStr
    return (
      <div
        key={req.id}
        className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg ${isActive ? 'bg-muted/50 border-primary/20' : ''}`}
      >
        <div className="mb-3 sm:mb-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold">{req.employees?.name}</span>
            <Badge
              variant={req.type === 'FOLGA' ? 'outline' : 'default'}
              className={getBadgeStyle(req.type)}
            >
              {req.type}
            </Badge>
            {isActive && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 hover:bg-green-200 border-transparent"
              >
                Ativo Agora
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            {formatDateBR(req.start_date)} até {formatDateBR(req.end_date)}
            <span className="text-xs opacity-70">({req.employees?.category})</span>
          </p>
          {req.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{req.notes}"</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setEditingRequest(req)}>
            <Edit className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Editar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(req.id)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Equipe</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>
        <Card className={activeVacations.length > 0 ? 'border-amber-500/30 bg-amber-500/5' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle
              className={`text-sm font-medium ${activeVacations.length > 0 ? 'text-amber-600' : ''}`}
            >
              Férias Hoje
            </CardTitle>
            <Palmtree
              className={`h-4 w-4 ${activeVacations.length > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${activeVacations.length > 0 ? 'text-amber-600' : ''}`}
            >
              {activeVacations.length}
            </div>
          </CardContent>
        </Card>
        <Card className={activeDaysOff.length > 0 ? 'border-blue-500/30 bg-blue-500/5' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle
              className={`text-sm font-medium ${activeDaysOff.length > 0 ? 'text-blue-600' : ''}`}
            >
              Folgas Hoje
            </CardTitle>
            <CalendarOff
              className={`h-4 w-4 ${activeDaysOff.length > 0 ? 'text-blue-500' : 'text-muted-foreground'}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${activeDaysOff.length > 0 ? 'text-blue-600' : ''}`}
            >
              {activeDaysOff.length}
            </div>
          </CardContent>
        </Card>
        <Card className={activeAtestados.length > 0 ? 'border-rose-500/30 bg-rose-500/5' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle
              className={`text-sm font-medium ${activeAtestados.length > 0 ? 'text-rose-600' : ''}`}
            >
              Atestados Hoje
            </CardTitle>
            <Stethoscope
              className={`h-4 w-4 ${activeAtestados.length > 0 ? 'text-rose-500' : 'text-muted-foreground'}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${activeAtestados.length > 0 ? 'text-rose-600' : ''}`}
            >
              {activeAtestados.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-orange-200 shadow-sm bg-orange-50/20">
          <CardHeader className="pb-4 border-b border-orange-100">
            <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Ausências na Próxima Semana
            </CardTitle>
            <CardDescription className="text-orange-700/80">
              Profissionais ausentes nos próximos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {nextWeekAbsences.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg border-dashed border-orange-200 bg-white/50">
                Nenhuma ausência programada para os próximos 7 dias.
              </p>
            ) : (
              nextWeekAbsences.map(renderRequest)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-lg">Todas as Escalas Programadas</CardTitle>
            <CardDescription>Visão geral de todas as ausências ativas e futuras</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {upcomingRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg border-dashed">
                Nenhuma ausência programada.
              </p>
            ) : (
              upcomingRequests.map(renderRequest)
            )}
          </CardContent>
        </Card>
      </div>

      <TimeOffFormModal
        open={!!editingRequest}
        onOpenChange={(open) => !open && setEditingRequest(null)}
        request={editingRequest}
      />
    </div>
  )
}
