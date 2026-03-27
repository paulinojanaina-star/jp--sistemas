import { useTeamStore } from '@/stores/useTeamStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Palmtree, CalendarOff, Trash2, Edit } from 'lucide-react'
import { useState } from 'react'
import { TimeOffFormModal } from './TimeOffFormModal'
import { TimeOffRequest } from '@/types/team'
import { format } from 'date-fns'

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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Profissionais</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Equipe cadastrada</p>
          </CardContent>
        </Card>
        <Card className={activeVacations.length > 0 ? 'border-amber-500/30 bg-amber-500/5' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle
              className={`text-sm font-medium ${activeVacations.length > 0 ? 'text-amber-600' : ''}`}
            >
              Férias Atuais
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
            <p className="text-xs text-muted-foreground mt-1">Profissionais em férias hoje</p>
          </CardContent>
        </Card>
        <Card className={activeDaysOff.length > 0 ? 'border-blue-500/30 bg-blue-500/5' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle
              className={`text-sm font-medium ${activeDaysOff.length > 0 ? 'text-blue-600' : ''}`}
            >
              Folgas Atuais
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
            <p className="text-xs text-muted-foreground mt-1">Profissionais de folga hoje</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Escalas e Ausências Programadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg border-dashed">
                Nenhuma férias ou folga programada.
              </p>
            ) : (
              upcomingRequests.map((req) => {
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
                          variant={req.type === 'FERIAS' ? 'default' : 'outline'}
                          className={
                            req.type === 'FERIAS'
                              ? 'bg-amber-500 hover:bg-amber-600 text-white'
                              : 'text-blue-600 border-blue-200 bg-blue-50'
                          }
                        >
                          {req.type}
                        </Badge>
                        {isActive && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Ativo Agora
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        {formatDateBR(req.start_date)} até {formatDateBR(req.end_date)}
                        <span className="text-xs opacity-70">({req.employees?.category})</span>
                      </p>
                      {req.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">"{req.notes}"</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => setEditingRequest(req)}>
                        <Edit className="h-4 w-4 sm:mr-2" />{' '}
                        <span className="hidden sm:inline">Editar</span>
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
              })
            )}
          </div>
        </CardContent>
      </Card>

      <TimeOffFormModal
        open={!!editingRequest}
        onOpenChange={(open) => !open && setEditingRequest(null)}
        request={editingRequest}
      />
    </div>
  )
}
