import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTeamStore } from '@/stores/useTeamStore'
import {
  Users,
  ArrowLeft,
  CalendarCheck,
  Percent,
  AlertTriangle,
  Clock,
  Plus,
  Calendar as CalendarIcon,
  Briefcase,
} from 'lucide-react'
import { startOfDay, addDays, endOfDay } from 'date-fns'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { TimeOffFormModal } from '@/components/team/TimeOffFormModal'
import { TeamCalendar } from '@/components/team/TeamCalendar'
import { TimeOffList } from '@/components/team/TimeOffList'
import { EmployeeList } from '@/components/team/EmployeeList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmployeeFormModal } from '@/components/team/EmployeeFormModal'

export default function Team() {
  const { employees, timeOffRequests } = useTeamStore()
  const [activeTab, setActiveTab] = useState('calendario')
  const [editingRequest, setEditingRequest] = useState<any | null>(null)
  const [isTimeOffModalOpen, setIsTimeOffModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null)
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false)

  const today = startOfDay(new Date())
  const nextWeekStart = addDays(today, 1)
  const nextWeekEnd = addDays(today, 7)

  const upcomingAbsences = useMemo(() => {
    return timeOffRequests.filter((req) => {
      const reqStart = startOfDay(new Date(req.start_date))
      const reqEnd = endOfDay(new Date(req.end_date))
      return reqStart <= nextWeekEnd && reqEnd >= nextWeekStart
    })
  }, [timeOffRequests, nextWeekStart, nextWeekEnd])

  const getAbsencesForDay = (date: Date) => {
    return timeOffRequests.filter((req) => {
      const reqStart = startOfDay(new Date(req.start_date))
      const reqEnd = endOfDay(new Date(req.end_date))
      return date >= reqStart && date <= reqEnd
    })
  }

  const handleEditTimeOff = (id: string) => {
    const req = timeOffRequests.find((r) => r.id === id)
    if (req) {
      setEditingRequest(req)
      setIsTimeOffModalOpen(true)
    }
  }

  const handleEditEmployee = (id: string) => {
    const emp = employees.find((e) => e.id === id)
    if (emp) {
      setEditingEmployee(emp)
      setIsEmployeeModalOpen(true)
    }
  }

  const handleViewTimeOffs = (id: string) => {
    setActiveTab('ausencias')
  }

  const totalEmployees = employees.length
  const absencesToday = getAbsencesForDay(today).length
  const availableToday = totalEmployees - absencesToday
  const occupancyRate = totalEmployees > 0 ? Math.round((availableToday / totalEmployees) * 100) : 0

  return (
    <div className="space-y-8 animate-fade-in-up pb-8 p-4 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-4 pb-6 border-b border-border/40">
        <Button
          variant="outline"
          size="icon"
          asChild
          className="rounded-full h-11 w-11 bg-background shadow-sm hover:shadow-md transition-all"
        >
          <Link to="/">
            <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
          </Link>
        </Button>
        <div>
          <h3 className="text-2xl md:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            Capital Humano
          </h3>
          <p className="text-sm font-bold text-muted-foreground mt-1 tracking-wide">
            Gestão inteligente de escalas e ausências corporativas
          </p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white dark:bg-slate-900 border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total de Colaboradores</p>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Registrados no sistema</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Disponíveis Hoje</p>
              <CalendarCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black">{availableToday}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              {absencesToday > 0 ? `${absencesToday} ausências hoje` : 'Equipe 100% completa'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-l-4 border-l-indigo-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Taxa de Ocupação</p>
              <Percent className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black">{occupancyRate}%</div>
            <div className="w-full bg-secondary h-2 mt-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'bg-white dark:bg-slate-900 border-l-4 shadow-sm',
            upcomingAbsences.length > 0 ? 'border-l-orange-500' : 'border-l-slate-300',
          )}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Alertas da Semana</p>
              <AlertTriangle
                className={cn(
                  'h-4 w-4',
                  upcomingAbsences.length > 0 ? 'text-orange-500' : 'text-slate-400',
                )}
              />
            </div>
            <div className="text-2xl font-black">{upcomingAbsences.length}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Ausências nos próximos 7 dias
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto p-1 bg-muted/50 rounded-xl gap-1">
          <TabsTrigger
            value="calendario"
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2.5 font-medium flex items-center justify-center gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            <span>Calendário de Escala</span>
          </TabsTrigger>
          <TabsTrigger
            value="ausencias"
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2.5 font-medium flex items-center justify-center gap-2"
          >
            <Clock className="h-4 w-4" />
            <span>Lançamentos de Ausências</span>
          </TabsTrigger>
          <TabsTrigger
            value="profissionais"
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2.5 font-medium flex items-center justify-center gap-2"
          >
            <Briefcase className="h-4 w-4" />
            <span>Gestão de Profissionais</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendario" className="space-y-6 outline-none focus-visible:ring-0">
          <TeamCalendar />
        </TabsContent>

        <TabsContent value="ausencias" className="space-y-6 outline-none focus-visible:ring-0">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => {
                setEditingRequest(null)
                setIsTimeOffModalOpen(true)
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Ausência
            </Button>
          </div>
          <TimeOffList onEdit={handleEditTimeOff} />
        </TabsContent>

        <TabsContent value="profissionais" className="space-y-6 outline-none focus-visible:ring-0">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => {
                setEditingEmployee(null)
                setIsEmployeeModalOpen(true)
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Profissional
            </Button>
          </div>
          <EmployeeList onEdit={handleEditEmployee} onViewTimeOffs={handleViewTimeOffs} />
        </TabsContent>
      </Tabs>

      <TimeOffFormModal
        open={isTimeOffModalOpen}
        onOpenChange={(open) => {
          setIsTimeOffModalOpen(open)
          if (!open) setEditingRequest(null)
        }}
        request={editingRequest}
      />

      <EmployeeFormModal
        open={isEmployeeModalOpen}
        onOpenChange={(open) => {
          setIsEmployeeModalOpen(open)
          if (!open) setEditingEmployee(null)
        }}
        employee={editingEmployee}
      />
    </div>
  )
}
