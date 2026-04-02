import { useTeamStore } from '@/stores/useTeamStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Search,
  Users,
  Palmtree,
  CalendarOff,
  Stethoscope,
  AlertTriangle,
  LayoutList,
  Calendar as CalendarIcon,
} from 'lucide-react'
import { useState } from 'react'
import { TimeOffFormModal } from './TimeOffFormModal'
import { TimeOffRequest } from '@/types/team'
import { SmartTimeOffCard } from './SmartTimeOffCard'
import { TimeOffCalendar } from './TimeOffCalendar'

export function TeamDashboard() {
  const { employees, timeOffRequests, deleteTimeOff } = useTeamStore()
  const [editingRequest, setEditingRequest] = useState<TimeOffRequest | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('list')

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

  const absentToday = timeOffRequests
    .filter((r) => r.start_date <= todayStr && r.end_date >= todayStr)
    .sort((a, b) => (a.employees?.name || '').localeCompare(b.employees?.name || ''))

  const nextWeekAbsences = timeOffRequests
    .filter((r) => r.start_date <= nextWeekEndStr && r.end_date >= tmrStr)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))

  const upcomingRequests = timeOffRequests
    .filter((r) => r.start_date >= todayStr)
    .filter((r) =>
      searchTerm ? r.employees?.name?.toLowerCase().includes(searchTerm.toLowerCase()) : true,
    )
    .sort((a, b) => a.start_date.localeCompare(b.start_date))

  const calendarRequests = timeOffRequests.filter((r) =>
    searchTerm ? r.employees?.name?.toLowerCase().includes(searchTerm.toLowerCase()) : true,
  )

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro de ausência?')) {
      await deleteTimeOff(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Profissionais</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex-1 flex items-center">
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>
        <Card
          className={`flex flex-col ${activeVacations.length > 0 ? 'border-amber-500/30 bg-amber-500/5' : ''}`}
        >
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
          <CardContent className="flex-1 flex items-center">
            <div
              className={`text-2xl font-bold ${activeVacations.length > 0 ? 'text-amber-600' : ''}`}
            >
              {activeVacations.length}
            </div>
          </CardContent>
        </Card>
        <Card
          className={`flex flex-col ${activeDaysOff.length > 0 ? 'border-blue-500/30 bg-blue-500/5' : ''}`}
        >
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
          <CardContent className="flex-1 flex items-center">
            <div
              className={`text-2xl font-bold ${activeDaysOff.length > 0 ? 'text-blue-600' : ''}`}
            >
              {activeDaysOff.length}
            </div>
          </CardContent>
        </Card>
        <Card
          className={`flex flex-col ${activeAtestados.length > 0 ? 'border-rose-500/30 bg-rose-500/5' : ''}`}
        >
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
          <CardContent className="flex-1 flex items-center">
            <div
              className={`text-2xl font-bold ${activeAtestados.length > 0 ? 'text-rose-600' : ''}`}
            >
              {activeAtestados.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card
        className={cn(
          'shadow-sm',
          absentToday.length > 0
            ? 'border-rose-200 bg-rose-50/30'
            : 'border-emerald-200 bg-emerald-50/30',
        )}
      >
        <CardHeader
          className={cn(
            'pb-3 border-b',
            absentToday.length > 0 ? 'border-rose-100/50' : 'border-emerald-100/50',
          )}
        >
          <div className="flex items-center justify-between">
            <CardTitle
              className={cn(
                'text-base flex items-center gap-2',
                absentToday.length > 0 ? 'text-rose-800' : 'text-emerald-800',
              )}
            >
              <AlertTriangle
                className={cn(
                  'h-5 w-5',
                  absentToday.length > 0 ? 'text-rose-600' : 'text-emerald-600',
                )}
              />
              Ausentes Hoje
            </CardTitle>
            <Badge
              variant="secondary"
              className={cn(
                'border-none',
                absentToday.length > 0
                  ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                  : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
              )}
            >
              {absentToday.length} ausentes
            </Badge>
          </div>
          <CardDescription
            className={absentToday.length > 0 ? 'text-rose-700/80' : 'text-emerald-700/80'}
          >
            Profissionais que não estão disponíveis no dia de hoje
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {absentToday.length === 0 ? (
            <p className="text-sm text-emerald-700/80 py-6 text-center border rounded-lg border-dashed border-emerald-200/50 bg-white/40">
              Nenhum profissional ausente hoje. A equipe está completa!
            </p>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-thin">
              {absentToday.map((req) => (
                <div key={req.id} className="min-w-[300px] w-[300px] flex-shrink-0">
                  <SmartTimeOffCard req={req} onEdit={setEditingRequest} onDelete={handleDelete} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-orange-200 shadow-sm bg-orange-50/30">
        <CardHeader className="pb-3 border-b border-orange-100/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-orange-800 flex items-center gap-2">
              <CalendarOff className="h-5 w-5 text-orange-600" />
              Ausências na Próxima Semana
            </CardTitle>
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-none"
            >
              {nextWeekAbsences.length} agendadas
            </Badge>
          </div>
          <CardDescription className="text-orange-700/80">
            Profissionais com ausência programada para os próximos 7 dias
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {nextWeekAbsences.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center border rounded-lg border-dashed border-orange-200/50 bg-white/40">
              Nenhuma ausência programada para os próximos dias. A equipe está completa!
            </p>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-thin">
              {nextWeekAbsences.map((req) => (
                <div key={req.id} className="min-w-[300px] w-[300px] flex-shrink-0">
                  <SmartTimeOffCard req={req} onEdit={setEditingRequest} onDelete={handleDelete} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Todas as Escalas Programadas</h2>
              <p className="text-sm text-muted-foreground">Visão geral das ausências e folgas</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por colaborador..."
                  className="pl-9 h-9 bg-card"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <TabsList className="h-9">
                <TabsTrigger value="list" className="px-3">
                  <LayoutList className="h-4 w-4 mr-2" /> Lista
                </TabsTrigger>
                <TabsTrigger value="calendar" className="px-3">
                  <CalendarIcon className="h-4 w-4 mr-2" /> Calendário
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="list" className="mt-0 animate-fade-in-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {upcomingRequests.length === 0 ? (
                <div className="col-span-full py-12 text-center flex flex-col items-center justify-center border rounded-xl border-dashed bg-card">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                    <Search className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Nenhuma escala futura encontrada
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Não há ausências programadas a partir de hoje.
                  </p>
                </div>
              ) : (
                upcomingRequests.map((req) => (
                  <SmartTimeOffCard
                    key={req.id}
                    req={req}
                    onEdit={setEditingRequest}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="mt-0 animate-fade-in-up">
            <Card className="p-4 shadow-sm border-slate-200">
              <TimeOffCalendar requests={calendarRequests} />
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <TimeOffFormModal
        open={!!editingRequest}
        onOpenChange={(open) => !open && setEditingRequest(null)}
        request={editingRequest}
      />
    </div>
  )
}
