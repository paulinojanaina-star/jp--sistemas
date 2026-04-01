import { useTeamStore } from '@/stores/useTeamStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
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

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        <Card className="border-orange-200 shadow-sm bg-orange-50/20 flex flex-col h-full lg:col-span-4">
          <CardHeader className="pb-4 border-b border-orange-100">
            <CardTitle className="text-base text-orange-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Ausências na Próxima Semana
            </CardTitle>
            <CardDescription className="text-orange-700/80">
              Profissionais ausentes nos próximos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 flex-1">
            {nextWeekAbsences.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg border-dashed border-orange-200 bg-white/50">
                Nenhuma ausência programada.
              </p>
            ) : (
              nextWeekAbsences.map((req) => (
                <SmartTimeOffCard
                  key={req.id}
                  req={req}
                  onEdit={setEditingRequest}
                  onDelete={handleDelete}
                />
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col h-full lg:col-span-8 space-y-4">
          <Tabs defaultValue="list" className="w-full">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <TimeOffCalendar requests={calendarRequests} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <TimeOffFormModal
        open={!!editingRequest}
        onOpenChange={(open) => !open && setEditingRequest(null)}
        request={editingRequest}
      />
    </div>
  )
}
